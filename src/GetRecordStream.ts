/**
 * @Author: abbeymart | Abi Akindele | @Created: 2020-04-05 | @Updated: 2020-05-16
 * @Company: mConnect.biz | @License: MIT
 * @Description: get stream of records, by params, by role / by userId | cache-in-memory
 */

// Import required module(s)
import { Cursor, ObjectId } from 'mongodb';
import Crud from './Crud';
import { CrudOptionsType, CrudTaskType, } from "./types";
import { validateGetParams } from "./ValidateCrudParam";
import { getParamsMessage } from "@mconnect/mcutils";

class GetRecordStream extends Crud {
    constructor(params: CrudTaskType,
                options: CrudOptionsType = {}) {
        super(params, options);
        // Set specific instance properties
    }

    async getRecordStream(): Promise<Cursor> {
        // Check/validate the attributes / parameters
        const dbCheck = this.checkDb(this.appDb);
        if (dbCheck.code !== "success") {
            // return dbCheck;
            throw new Error(dbCheck.message);
        }
        const auditDbCheck = this.checkDb(this.auditDb);
        if (auditDbCheck.code !== "success") {
            // return auditDbCheck;
            throw new Error(auditDbCheck.message);
        }
        const accessDbCheck = this.checkDb(this.accessDb);
        if (accessDbCheck.code !== "success") {
            // return accessDbCheck;
            throw new Error(accessDbCheck.message);
        }

        const errors = validateGetParams(this.params);
        if (Object.keys(errors).length > 0) {
            const errorRes = getParamsMessage(errors, "paramsError");
            // return getParamsMessage(errors);
            throw new Error(errorRes.message);
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

        // check the audit-log settings - to perform audit-log (read/search info - params, keywords etc.)
        if (this.logRead && this.queryParams && Object.keys(this.queryParams).length > 0) {
            await this.transLog.readLog(this.coll, this.queryParams, this.userId);
        } else if (this.logRead && this.docIds && this.docIds.length > 0) {
            await this.transLog.readLog(this.coll, this.docIds, this.userId);
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
                return await appDbColl.find({_id: {$in: this.docIds}})
                    .skip(this.skip)
                    .limit(this.limit)
                    .project(this.projectParams)
                    .sort(this.sortParams)
                    // .stream();
            } catch (error) {
                console.error(error);
                throw new Error(`notFound: ${error.message}`);
            }
        }
        if (this.queryParams && Object.keys(this.queryParams).length > 0) {
            try {
                // use / activate database
                const appDbColl = this.appDb.collection(this.coll);
                return await appDbColl.find(this.queryParams)
                    .skip(this.skip)
                    .limit(this.limit)
                    .project(this.projectParams)
                    .sort(this.sortParams)
                    // .stream();
            } catch (error) {
                console.error(error);
                throw new Error(`notFound: ${error.message}`);
            }
        }
        // get all documents, up to the permissible limit
        try {
            // use / activate database
            const appDbColl = this.appDb.collection(this.coll);
            return await appDbColl.find()
                .skip(this.skip)
                .limit(this.limit)
                .project(this.projectParams)
                .sort(this.sortParams)
                // .stream();
        } catch (error) {
            console.error(error);
            throw new Error(`notFound: ${error.message}`);
        }
    }
}

// factory function/constructor
function newGetRecordStream(params: CrudTaskType,
                            options: CrudOptionsType = {}) {
    return new GetRecordStream(params, options);
}

export { GetRecordStream, newGetRecordStream };
