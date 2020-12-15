/**
 * @Author: abbeymart | Abi Akindele | @Created: 2020-04-05 | @Updated: 2020-05-16
 * @Company: mConnect.biz | @License: MIT
 * @Description: get records, by params, by role / by userId | cache-in-memory
 */

// Import required module(s)
import { ObjectId } from "mongodb";
import { getHashCache, setHashCache, CacheResponseType } from "@mconnect/mccache";
import { getResMessage, ResponseMessage } from "@mconnect/mcresponse";
import Crud from "./Crud";
import { CrudOptionsType, CrudTaskType } from "./types";
import { validateGetParams } from "./ValidateCrudParam";
import { getParamsMessage } from "@mconnect/mcutils";

class GetRecord extends Crud {
    constructor(params: CrudTaskType,
                options: CrudOptionsType = {}) {
        super(params, options);
        // Set specific instance properties
    }

    async getRecord(): Promise<ResponseMessage> {
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

        const errors = validateGetParams(this.params);
        if (Object.keys(errors).length > 0) {
            return getParamsMessage(errors);
        }

        // set maximum limit and default values per query
        if (this.limit < 1) {
            this.limit = 1;
        } else if (this.limit > this.maxQueryLimit) {
            this.limit = this.maxQueryLimit;
        }
        if (this.skip < 0) {
            this.skip = 0;
        }

        // check read permission
        // let roleServices: RoleServiceType;

        // check the audit-log settings - to perform audit-log (read/search info - params, keywords etc.)
        if (this.logRead && this.queryParams && Object.keys(this.queryParams).length > 0) {
            await this.transLog.readLog(this.coll, this.queryParams, this.userId);
        } else if (this.logRead && this.docIds && this.docIds.length > 0) {
            await this.transLog.readLog(this.coll, this.docIds, this.userId);
        }

        // check cache for matching record(s), and return if exist
        try {
            const items: CacheResponseType = await getHashCache(this.coll, this.hashKey);
            if (items && items.value && Array.isArray(items.value) && items.value.length > 0) {
                console.log("cache-items-before-query: ", items.value[0]);
                return getResMessage("success", {
                    value  : items.value,
                    message: "from cache",
                });
            }
        } catch (e) {
            console.error("error from the cache: ", e.stack);
        }

        // id(s): convert string to ObjectId
        this.docIds = this.docIds && this.docIds.length > 0 ? this.docIds.map(id => new ObjectId(id)) : [];

        // exclude _id, if present, from the queryParams
        if (this.queryParams && Object.keys(this.queryParams).length > 0) {
            const qParams: any = this.queryParams;
            const {_id, ...otherParams} = qParams; // exclude _id, if present
            this.queryParams = otherParams;
        }

        // Get the item(s) by docId(s), queryParams or all items
        if (this.docIds && this.docIds.length > 0) {
            try {
                // use / activate database
                const appDbColl = this.appDb.collection(this.coll);
                const result = await appDbColl.find({_id: {$in: this.docIds}})
                    .skip(this.skip)
                    .limit(this.limit)
                    .project(this.projectParams)
                    .sort(this.sortParams)
                    .toArray();
                if (result.length > 0) {
                    // save copy in the cache
                    await setHashCache(this.coll, this.hashKey, result, this.cacheExpire);
                    return getResMessage("success", {
                        value: result,
                    });
                }
                return getResMessage("notFound");
            } catch (error) {
                return getResMessage("notFound", {
                    value: error,
                });
            }
        }
        if (this.queryParams && Object.keys(this.queryParams).length > 0) {
            try {
                // use / activate database
                const appDbColl = this.appDb.collection(this.coll);
                const result = await appDbColl.find(this.queryParams)
                    .skip(this.skip)
                    .limit(this.limit)
                    .project(this.projectParams)
                    .sort(this.sortParams)
                    .toArray();
                if (result.length > 0) {
                    // save copy in the cache
                    await setHashCache(this.coll, this.hashKey, result, this.cacheExpire);
                    return getResMessage("success", {
                        value: result,
                    });
                }
                return getResMessage("notFound");
            } catch (error) {
                return getResMessage("notFound", {
                    value: error,
                });
            }
        }
        // get all records, up to the permissible limit
        try {
            // use / activate database
            const appDbColl = this.appDb.collection(this.coll);
            const result = await appDbColl.find()
                .skip(this.skip)
                .limit(this.limit)
                .project(this.projectParams)
                .sort(this.sortParams)
                .toArray();
            if (result.length > 0) {
                // save copy in the cache
                await setHashCache(this.coll, this.hashKey, result, this.cacheExpire);
                return getResMessage("success", {
                    value: result,
                });
            }
            return getResMessage("notFound");
        } catch (error) {
            return getResMessage("notFound", {
                value: error,
            });
        }
    }
}

// factory function/constructor
function newGetRecord(params: CrudTaskType,
                      options: CrudOptionsType = {}) {
    return new GetRecord(params, options);
}

export { GetRecord, newGetRecord };
