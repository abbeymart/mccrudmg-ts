/**
 * @Author: abbeymart | Abi Akindele | @Created: 2018-11-19 | @Updated: 2019-06-15
 * @Company: mConnect.biz | @License: MIT
 * @Description: bulk load records / documents, strictly for server-side(admin) ETL tasks
 */

// Import required module/function(s)
import { getResMessage, ResponseMessage } from "@mconnect/mcresponse";
import { validateLoadParams } from "./ValidateCrudParam";
import { getParamsMessage, checkDb, isEmptyObject } from "./helper";
import { CrudOptionsType, CrudTaskType, MongoDbConnectType, UserInfoType } from "./types";

class LoadRecord {
    protected params: CrudTaskType;
    protected appDb: MongoDbConnectType;
    protected coll: string;
    protected token: string;
    protected userInfo: UserInfoType;
    protected actionParams: Array<object>;
    protected userId: string;
    protected maxQueryLimit: number;

    constructor(params: CrudTaskType, options: CrudOptionsType = {}) {
        this.params = params;
        this.appDb = params.appDb;
        this.coll = params.coll;
        this.actionParams = params && params.actionParams ? params.actionParams : [];
        this.userInfo = params && params.userInfo ? params.userInfo :
            {
                token    : "",
                userId   : "",
                firstName: "",
                lastName : "",
                language : "",
                loginName: "",
                expire   : 0,
            };
        this.token = params && params.token ? params.token : this.userInfo.token || "";
        this.userId = this.userInfo.userId || "";
        this.maxQueryLimit = options && options.maxQueryLimit ? options.maxQueryLimit : 10000;
    }

    async loadRecord() {
        // Check/validate the attributes / parameters
        const dbCheck = checkDb(this.appDb);
        if (dbCheck.code !== "success") {
            return dbCheck;
        }

        // limit maximum records to bulk-load to 10,000 records
        if (this.maxQueryLimit > 10000) {
            this.maxQueryLimit = 10000;
        }

        const errors = validateLoadParams(this.params);
        if (this.actionParams.length > 10000) {
            errors.maxQueryLimit = `${this.actionParams.length} records load-request, exceeded ${this.maxQueryLimit} limit. 
        Please send not more than ${this.maxQueryLimit} records to load at a time`;
        }
        if (!isEmptyObject(errors)) {
            return getParamsMessage(errors, "paramsError");
        }

        // create/load multiple records
        if (this.actionParams.length > 0) {
            // check if items/records exist using the existParams/actionParams
            try {
                // use / activate database-collection
                const appDbColl = this.appDb.collection(this.coll);

                // clear the current collection documents/records, for refresh
                await appDbColl.deleteMany({});
                // refresh (insert/create) new multiple records
                const records = await appDbColl.insertMany(this.actionParams);
                if (records.insertedCount > 0) {
                    return getResMessage('success', {
                        message: `${records.insertedCount} record(s) created successfully.`,
                        value  : {
                            docCount: records.insertedCount,
                        },
                    });
                }
                return getResMessage('insertError', {
                    message: 'Error-inserting/creating new record(s). Please retry.',
                    value  : {
                        docCount: records.insertedCount,
                    },
                });
            } catch (error) {
                return getResMessage('insertError', {
                    message: 'Error-inserting/creating new record(s). Please retry.',
                    value  : {
                        error,
                    },
                });
            }
        }
        // return unAuthorised
        return getResMessage('insertError', {
            message: 'No records inserted. Please retry',
        });
    }

}

// factory function
function newLoadRecord(params: CrudTaskType, options: CrudOptionsType = {}) {
    return new LoadRecord(params, options);
}

export { LoadRecord, newLoadRecord };
