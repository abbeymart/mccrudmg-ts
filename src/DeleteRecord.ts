/**
 * @Author: abbeymart | Abi Akindele | @Created: 2020-04-05 | @Updated: 2020-05-16
 * Updated 2018-04-08, prototype-to-class
 * @Company: mConnect.biz | @License: MIT
 * @Description: delete one or more records / documents
 */

// Import required module/function(s)
import { DeleteWriteOpResultObject, ObjectId } from "mongodb";
import { getResMessage, ResponseMessage } from "@mconnect/mcresponse";
import Crud from "./Crud";
import { deleteHashCache } from "@mconnect/mccache";
import { CrudOptionsType, CrudTaskType, TaskTypes } from "./types";
import { validateDeleteParams } from "./ValidateCrudParam";
import { getParamsMessage, isEmptyObject } from "./helper";

class DeleteRecord extends Crud {
    constructor(params: CrudTaskType,
                options: CrudOptionsType = {}) {
        super(params, options);
        // Set specific instance properties
        this.currentRecs = [];
        this.subItems = [];
    }

    async deleteRecord(): Promise<ResponseMessage> {
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

        const errors = validateDeleteParams(this.params);
        if (!isEmptyObject(errors)) {
            return getParamsMessage(errors, "paramsError");
        }

        // for queryParams, exclude _id, if present
        if (this.queryParams && Object.keys(this.queryParams).length > 0) {
            let querySpec: any = this.queryParams;
            const {_id, ...otherParams} = querySpec;
            this.queryParams = otherParams;
        }

        // delete / remove item(s) by docId(s)
        if (this.docIds && this.docIds.length > 0) {
            try {
                // id(s): convert string to ObjectId
                this.docIds = this.docIds.map(id => new ObjectId(id));
                // check if records exist, for delete and audit-log
                const recExist = await this.getCurrentRecord();
                if (recExist.code !== "success") {
                    return recExist;
                }
                // sub-items integrity check, same collection
                const subItem = await this.checkSubItem();
                if (!(subItem.code === "success")) {
                    return subItem;
                }

                // parent-child integrity check, multiple collections
                const refIntegrity = await this.checkRefIntegrity();
                if (!(refIntegrity.code === "success")) {
                    return refIntegrity;
                }

                // delete/remove records
                return await this.removeRecord();
            } catch (error) {
                return getResMessage("removeError", {
                    message: error.message ? error.message : "Error removing record(s)",
                });
            }
        }

        // delete / remove item(s) by queryParams
        if (this.queryParams && Object.keys(this.queryParams).length) {
            try {
                // check if records exist, for delete and audit-log
                const recExist = await this.getCurrentRecordByParams();
                if (!(recExist.code === "success")) {
                    return recExist;
                }

                // sub-items integrity check, same collection
                const subItem = await this.checkSubItemByParams();
                if (!(subItem.code === "success")) {
                    return subItem;
                }

                // parent-child integrity check, multiple collections
                const refIntegrity = await this.checkRefIntegrityByParams();
                if (!(refIntegrity.code === "success")) {
                    return refIntegrity;
                }

                // delete/remove records
                return await this.removeRecordByParams();

            } catch (error) {
                return getResMessage("removeError", {
                    message: error.message,
                });
            }
        }

        // could not remove document
        return getResMessage("removeError", {
            message: "Unable to perform the requested action(s), due to incomplete/incorrect delete conditions. ",
        });
    }

    async checkSubItem(): Promise<ResponseMessage> {
        // same collection referential integrity checks
        // check if any/some of the current records contain at least a sub-item
        const appDbColl = this.appDb.collection(this.coll);
        const docWithSubItems = await appDbColl.findOne({
            parentId: {
                $in: this.docIds,
            }
        });

        if (docWithSubItems) {
            return getResMessage("subItems", {
                message: "A record that includes sub-items cannot be deleted. Delete/remove the sub-items first.",
            });
        } else {
            return getResMessage("success", {
                message: "no data integrity issue",
            });
        }
    }

    async checkSubItemByParams(): Promise<ResponseMessage> {
        // same collection referential integrity checks
        // check if any/some of the current records contain at least a sub-item
        this.docIds = [];          // reset docIds instance value
        await this.currentRecs.forEach((item: any) => {
            this.docIds.push(item._id);
        });
        return await this.checkSubItem();
    }

    async checkRefIntegrity(): Promise<ResponseMessage> {
        // parent-child referential integrity checks
        // required-inputs: parent/child-collections and current item-id/item-name
        if (this.childColls && this.childColls.length > 0 && this.docIds && this.docIds.length > 0) {
            // prevent item delete, if child-collection-items reference itemId
            const childExist = this.childColls.some(async (collName) => {
                const appDbColl = this.appDb.collection(collName);
                const collItem = await appDbColl.findOne({
                    parentId: {
                        $in: this.docIds
                    }
                });
                if (collItem && Object.keys(collItem).length > 0)  {
                    this.subItems.push(true);
                    return true;
                } else {
                    return false;
                }
            });
            if (childExist || this.subItems.length > 0) {
                return getResMessage("subItems", {
                    message: `A record that contains sub-items cannot be deleted. Delete/remove the sub-items [from ${this.childColls.join(", ")} collection(s)], first.`,
                });
            } else {
                return getResMessage("success", {
                    message: "no data integrity issue",
                });
            }
        } else {
            return getResMessage("success", {
                message: "no data integrity checking or issue",
            });
        }
    }

    async checkRefIntegrityByParams(): Promise<ResponseMessage> {
        // parent-child referential integrity checks
        // required-inputs: parent/child-collections and current item-id/item-name
        this.docIds = [];
        await this.currentRecs.forEach((item: any) => {
            this.docIds.push(item._id);
        });
        return await this.checkRefIntegrity();
    }

    async removeRecord(): Promise<ResponseMessage> {
        // delete/remove records and log in audit-collection
        try {
            const appDbColl = this.appDb.collection(this.coll);
            const removed = await appDbColl.deleteMany({
                _id: {
                    $in: this.docIds
                }
            });
            if (removed.result.ok) {
                // delete cache
                await deleteHashCache(this.coll, this.hashKey);
                // check the audit-log settings - to perform audit-log
                if (this.logDelete) {
                    await this.transLog.deleteLog(this.coll, this.currentRecs, this.userId);
                }
                return getResMessage("success", {
                    message: "Item/record deleted successfully",
                    value  : {
                        docId: Number(removed.result.n),
                    }
                });
            } else {
                return getResMessage("removeError", {
                    message: "Error removing/deleting record(s): ",
                });
            }
        } catch (e) {
            return getResMessage("removeError", {
                message: `Error removing/deleting record(s): ${e.message ? e.message : ""}`,
                value  : e,
            });
        }
    }

    async removeRecordByParams(): Promise<ResponseMessage> {
        // delete/remove records and log in audit-collection
        try {
            const appDbColl = this.appDb.collection(this.coll);
            let removed: DeleteWriteOpResultObject;
            if (this.queryParams) {
                removed = await appDbColl.deleteMany(this.queryParams);
                if (removed.result.ok) {
                    // delete cache
                    await deleteHashCache(this.coll, this.hashKey);
                    // check the audit-log settings - to perform audit-log
                    if (this.logDelete) {
                        await this.transLog.deleteLog(this.coll, this.currentRecs, this.userId);
                    }
                    return getResMessage("success", {
                        message: "Item/record deleted successfully",
                        value  : {
                            docId: Number(removed.result.n),
                        }
                    });
                } else {
                    return getResMessage("deleteError", {message: "No record(s) deleted"});
                }
            } else {
                return getResMessage("deleteError", {message: "Unable to delete record(s), due to missing queryParams"});
            }
        } catch (e) {
            return getResMessage("removeError", {
                message: `Error removing/deleting record(s): ${e.message ? e.message : ""}`,
                value  : e,
            });
        }
    }
}

// factory function/constructor
function newDeleteRecord(params: CrudTaskType,
                         options: CrudOptionsType = {}) {
    return new DeleteRecord(params, options);
}

export { DeleteRecord, newDeleteRecord };
