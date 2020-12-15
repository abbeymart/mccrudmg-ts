/**
 * @Author: abbeymart | Abi Akindele | @Created: 2020-07-24
 * @Company: Copyright 2020 Abi Akindele  | mConnect.biz
 * @License: All Rights Reserved | LICENSE.md
 * @Description: mc-central-ts: save-record(s) (create/insert and update record(s))
 */

// Import required module/function(s)
import { ObjectId } from "mongodb";
import { getResMessage, ResponseMessage } from "@mconnect/mcresponse";
import Crud from "./Crud";
import { validateSaveParams } from "./ValidateCrudParam";
import {
    CrudOptionsType, CrudTaskType,
} from "./types";
import { deleteHashCache } from "@mconnect/mccache";
import { getParamsMessage } from "@mconnect/mcutils";
import { ActionParamsType, ActionParamTaskType } from "./types";
import { ModelOptionsType } from "./model";
import {isEmptyObject} from "./helper";

class SaveRecord extends Crud {
    protected modelOptions: ModelOptionsType;

    constructor(params: CrudTaskType,
                options: CrudOptionsType = {}) {
        super(params, options);
        // Set specific instance properties
        this.modelOptions = options && options.modelOptions ? options.modelOptions : {
            timeStamp  : true,
            actorStamp : true,
            activeStamp: true
        };
    }

    async saveRecord(): Promise<ResponseMessage> {
        // Check/validate the attributes / parameters
        const dbCheck = this.checkDb(this.appDb);
        if (dbCheck.code !== "success") {
            return dbCheck;
        }
        const auditDbCheck = this.checkDb(this.auditDb);
        if (auditDbCheck.code !== "success") {
            return auditDbCheck;
        }
        const accessDbCheck = this.checkDb(this.accessDb);
        if (accessDbCheck.code !== "success") {
            return accessDbCheck;
        }

        const errors = validateSaveParams(this.params);
        if (!isEmptyObject(errors)) {
            return getParamsMessage(errors);
        }
        // determine update / create (new) items from actionParams
        await this.computeItems();

        // for queryParams, exclude _id, if present
        if (this.queryParams && !isEmptyObject(this.queryParams)) {
            const {_id, ...otherParams} = this.queryParams as any;
            this.queryParams = otherParams;
        }

        // Ensure the _id for existParams are of type mongoDb-new ObjectId, for create / update actions
        if (this.existParams && this.existParams.length > 0) {
            this.existParams.forEach((item: any) => {
                // transform/cast id, from string, to mongoDB-new ObjectId
                Object.keys(item).forEach((itemKey: string) => {
                    if (itemKey.toString().toLowerCase().endsWith("id")) {
                        // create
                        if (typeof item[itemKey] === "string" && item[itemKey] !== "" && item[itemKey].length <= 24) {
                            item[itemKey] = new ObjectId(item[itemKey]);
                        }
                        // update
                        if (typeof item[itemKey] === "object" && item[itemKey]["$ne"] &&
                            (item[itemKey]["$ne"] !== "" || item[itemKey]["$ne"] !== null)) {
                            item[itemKey]["$ne"] = new ObjectId(item[itemKey]["$ne"])
                        }
                    }
                });
            });
        }

        // create records/documents
        if (this.createItems && this.existParams && this.createItems.length > 0 && this.createItems.length <= this.existParams.length) {
            try {
                // check duplicate records, i.e. if similar records exist
                const recExist: ResponseMessage = await this.checkRecExist();
                if (recExist.code !== "success") {
                    return recExist;
                }

                // create records
                return await this.createRecord();
            } catch (e) {
                console.error(e);
                return getResMessage("insertError", {
                    message: "Error-inserting/creating new record.",
                });
            }
        }

        // update existing records/documents
        if (this.existParams && this.updateItems && this.updateItems.length > 0 && this.updateItems.length <= this.existParams.length) {
            try {
                // check duplicate records, i.e. if similar records exist
                const recExist = await this.checkRecExist();
                if (recExist.code !== "success") {
                    return recExist;
                }

                // get current records update and audit log
                const currentRec = await this.getCurrentRecord();
                if (currentRec.code !== "success") {
                    return currentRec;
                }

                // update records
                return await this.updateRecordById();
            } catch (e) {
                console.error(e);
                return getResMessage("updateError", {
                    message: `Error updating record(s): ${e.message ? e.message : ""}`,
                });
            }
        }

        // update records/documents by queryParams: permitted by userId (own records), admin(all records) or role
        if (this.isAdmin && this.docIds && this.docIds.length < 1 && this.queryParams && !isEmptyObject(this.queryParams) && this.actionParams && this.actionParams.length === 1) {
            try {
                // check duplicate records, i.e. if similar records exist
                const recExist = await this.checkRecExist();
                if (recExist.code !== "success") {
                    return recExist;
                }

                // get current records update and audit log
                const currentRec = await this.getCurrentRecordByParams();
                if (currentRec.code !== "success") {
                    return currentRec;
                }

                // update records
                return await this.updateRecordByParams();
            } catch (e) {
                console.error(e);
                return getResMessage("updateError", {
                    message: `Error updating record(s): ${e.message ? e.message : ""}`,
                });
            }
        }

        // return save-error message
        return getResMessage("saveError", {
            message: "Error performing the requested operation(s). Please retry",
        });
    }

    // helper methods:
    async computeItems(modelOptions: ModelOptionsType = this.modelOptions): Promise<ActionParamTaskType> {
        let updateItems: ActionParamsType = [],
            docIds: Array<string> = [],
            createItems: ActionParamsType = [];

        // Ensure the _id for actionParams are of type mongoDb-new ObjectId, for update actions
        if (this.actionParams && this.actionParams.length > 0) {
            this.actionParams.forEach((item: any) => {
                // transform/cast id, from string, to mongoDB-new ObjectId
                Object.keys(item).forEach(itemKey => {
                    // simplify checking key that ends with id/ID/Id/iD, using toLowerCase()
                    if (itemKey.toString().toLowerCase().endsWith("id")) {
                        if (typeof item[itemKey] === "string" && item[itemKey] !== "" && item[itemKey].length <= 24) {
                            item[itemKey] = new ObjectId(item[itemKey]);
                        }
                    }
                });
                if (item._id) {
                    // update/existing document
                    if (modelOptions.actorStamp && item.updatedBy === undefined) {
                        item.updatedBy = this.userId;
                    }
                    if (modelOptions.timeStamp && item.updatedAt === undefined) {
                        item.updatedAt = new Date();
                    }
                    if (modelOptions.activeStamp && item.isActive === undefined) {
                        item.isActive = true;
                    }
                    updateItems.push(item);
                    docIds.push(item._id);
                } else {
                    // exclude any traces of _id without specified/concrete value ("", null, undefined), if present
                    // eslint-disable-next-line no-unused-vars
                    const {_id, ...saveParams} = item;
                    item = saveParams;
                    // create/new document
                    if (modelOptions.actorStamp && item.createdBy === undefined) {
                        item.createdBy = this.userId;
                    }
                    if (modelOptions.timeStamp && item.createdAt === undefined) {
                        item.createdAt = new Date();
                    }
                    if (modelOptions.activeStamp && item.isActive === undefined) {
                        item.isActive = true;
                    }
                    createItems.push(item);
                }
            });
            this.createItems = createItems;
            this.updateItems = updateItems;
            this.docIds = docIds;
        }
        return {
            createItems,
            updateItems,
            docIds,
        };
    }

    async createRecord(): Promise<ResponseMessage> {
        // insert/create multiple records and log in audit
        try {
            if (!this.isRecExist && this.createItems && this.createItems.length) {
                // insert/create multiple records and log in audit
                const appDbColl = this.appDb.collection(this.coll);
                const records = await appDbColl.insertMany(this.createItems);
                if (records.insertedCount > 0) {
                    // delete cache
                    await deleteHashCache(this.coll, this.hashKey, "key");
                    // check the audit-log settings - to perform audit-log
                    if (this.logCreate) await this.transLog.createLog(this.coll, this.createItems, this.userId);
                    return getResMessage("success", {
                        message: "Record(s) created successfully.",
                        value  : {
                            docCount: records.insertedCount,
                        },
                    });
                } else {
                    return getResMessage("insertError", {
                        message: "Unable to create new record(s), database error. ",
                    });
                }
            } else {
                return getResMessage("insertError", {
                    message: "Unable to create new record(s), due to incomplete/incorrect input-parameters. ",
                });
            }
        } catch (e) {
            return getResMessage("insertError", {
                message: `Error inserting/creating new record(s): ${e.message ? e.message : ""}`,
            });
        }
    }

    async updateRecordById(): Promise<ResponseMessage> {
        // updated records
        return new Promise(async (resolve) => {
            try {
                // check/validate update/upsert command for multiple records
                let updateCount = 0;

                if (!this.isRecExist) {
                    // update one record
                    if (this.updateItems && this.updateItems.length === 1) {
                        // destruct _id /other attributes
                        const item: any = this.updateItems[0];
                        const {
                            _id,
                            ...otherParams
                        } = item;
                        // control isAdmin setting:
                        const appDbColl = this.appDb.collection(this.coll);
                        if (this.coll === this.userColl && !this.isAdmin) {
                            // TODO: control/specify fields to update, i.e. change otherParams-info
                            const currentRec: any = await appDbColl.find({_id: _id});
                            otherParams.profile.isAdmin = currentRec && currentRec.profile && currentRec.profile.isAdmin ?
                                currentRec.profile.isAdmin :
                                false;
                        }
                        const updateResult = await appDbColl.updateOne({
                            _id: _id
                        }, {
                            $set: otherParams
                        });
                        updateCount += Number(updateResult.modifiedCount);
                    }

                    // update multiple records
                    if (this.updateItems && this.updateItems.length > 1) {
                        for (let i = 0; i < this.updateItems.length; i++) {
                            const item: any = this.updateItems[i];
                            // destruct _id /other attributes
                            const {
                                _id,
                                ...otherParams
                            } = item;
                            // control isAdmin setting:
                            const appDbColl = this.appDb.collection(this.coll);
                            if (this.coll === this.userColl && !this.isAdmin) {
                                // TODO: control/specify fields to update, i.e. change otherParams-info
                                const currentRec: any = await appDbColl.find({_id: _id});
                                otherParams.profile.isAdmin = currentRec && currentRec.profile && currentRec.profile.isAdmin ?
                                    currentRec.profile.isAdmin :
                                    false;
                            }
                            const updateResult = await appDbColl.updateOne({
                                _id: _id
                            }, {
                                $set: otherParams
                            });
                            updateCount += Number(updateResult.modifiedCount);
                        }
                    }

                    if (updateCount > 0) {
                        // delete cache
                        await deleteHashCache(this.coll, this.hashKey, "key");
                        // check the audit-log settings - to perform audit-log
                        if (this.logUpdate) await this.transLog.updateLog(this.coll, this.currentRecs, this.updateItems, this.userId);
                        resolve(getResMessage("success", {
                            message: "Record(s) updated successfully.",
                            value  : {
                                docCount: updateCount,
                            },
                        }));
                    } else {
                        resolve(getResMessage("updateError", {
                            message: "No records updated. Please retry.",
                        }));
                    }
                } else if (this.isRecExist) {
                    return getResMessage("recExist", {
                        message: this.recExistMessage,
                    });
                }
            } catch (e) {
                return getResMessage("updateError", {
                    message: `Error updating record(s): ${e.message ? e.message : ""}`,
                    value  : e,
                });
            }
        });
    }

    async updateRecordByParams(): Promise<ResponseMessage> {
        // updated records
        try {
            // check/validate update/upsert command for multiple records
            if (!this.isRecExist && this.actionParams) {
                // update multiple records
                // destruct _id /other attributes
                const item: any = this.actionParams[0];
                const {_id, ...otherParams} = item;
                // control isAdmin setting:
                const appDbColl = this.appDb.collection(this.coll);
                if (this.coll === this.userColl && !this.isAdmin) {
                    // TODO: control/specify fields to update, i.e. change otherParams-info
                    otherParams.profile.isAdmin = false;
                }
                // include item stamps: userId and date
                otherParams.updatedBy = this.userId;
                otherParams.updatedAt = new Date();
                const updateResult = await appDbColl.updateMany(this.queryParams as any, {
                    $set: otherParams
                });
                if (Number(updateResult.modifiedCount) > 0) {
                    // delete cache
                    await deleteHashCache(this.coll, this.hashKey, "key");
                    // check the audit-log settings - to perform audit-log
                    if (this.logUpdate) await this.transLog.updateLog(this.coll, this.currentRecs, otherParams, this.userId);
                    return getResMessage("success", {
                        message: "Requested action(s) performed successfully.",
                        value  : {
                            docCount: updateResult.modifiedCount,
                        },
                    });
                } else {
                    return getResMessage("updateError", {
                        message: "No records updated. Please retry.",
                    });
                }
            } else if (this.isRecExist) {
                return getResMessage("recExist", {
                    message: this.recExistMessage,
                });
            } else {
                return getResMessage("updateError", {
                    message: `Error updating record(s): `,
                });
            }
        } catch (e) {
            return getResMessage("updateError", {
                message: `Error updating record(s): ${e.message ? e.message : ""}`,
                value  : e,
            });
        }
    }

}

// factory function/constructor
function newSaveRecord(params: CrudTaskType,
                       options: CrudOptionsType = {}) {
    return new SaveRecord(params, options);
}

export { SaveRecord, newSaveRecord };
