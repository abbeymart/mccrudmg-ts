/**
 * @Author: abbeymart | Abi Akindele | @Created: 2020-07-26
 * @Company: Copyright 2020 Abi Akindele  | mConnect.biz
 * @License: All Rights Reserved | LICENSE.md
 * @Description: mc-central-ts: saveRecord testing
 */

import { ObjectId } from "mongodb";
import { SaveRecord, newSaveRecord } from "..";
import { mcTest, assertEquals, postTestResult } from "../../mc-test";
import { userInfo, dbName } from "./appUser";
import { newDbMongo } from "../../mc-db/src";
import { dbs } from "../../mc-db/test/config/dbConfig";
import { ResponseMessage } from "../../mc-response";
import { CrudTaskType } from "../src/types";

// test data
let coll = "locations",
    actionParams = [
        {
            code     : 'OY2b',
            name     : 'Oyo State',
            category : 'State',
            desc     : 'The State of Oyo in Nigeria',
            parentId : '5b57f583b3db46019a22bd9f',
            lang     : 'en-US',
            isActive : true,
            currency : 'NGN',
            phoneCode: 100,
        }
    ],
    actionParamsIdError = [
        {
            _id      : '',
            code     : 'OY2b',
            name     : 'Oyo State',
            category : 'State',
            desc     : 'The State of Oyo in Nigeria',
            parentId : '5b57f583b3db46019a22bd9f',
            lang     : 'en-US',
            isActive : true,
            currency : 'NGN',
            phoneCode: 100,
        }
    ],
    existParamsCreate = [
        {
            code    : 'OY2b',
            parentId: new ObjectId('5b57f583b3db46019a22bd9f')
        },
    ],
    actionParamsUpdate = [
        {
            _id        : '5b57f583b3db46019a22bd9d',
            createdBy  : 'XBnv8ghuNYagAWn7M',
            createdDate: '2015-03-15T21:11:46.965Z',
            isActive   : true,
            updatedBy  : '5b0e139b3151184425aae01c',
            updatedDate: '2018-08-20T01:10:23.454Z',
            parentId   : '5b7a0e03b967e171cd0ae99c',
            code       : 'UK',
            currency   : 'GBP',
            desc       : 'The United Kingdom NewUpdate',
            lang       : 'en-GB',
            name       : 'United Kingdom Updated',
            phoneCode  : 44,
            timezone   : '',
            lat        : 0,
            long       : 0,
            category   : 'Country'
        }
    ],
    actionParamsUpdateIdError = [
        {
            _id        : '',
            createdBy  : 'XBnv8ghuNYagAWn7M',
            createdDate: '2015-03-15T21:11:46.965Z',
            isActive   : true,
            updatedBy  : '5b0e139b3151184425aae01c',
            updatedDate: '2018-08-20T01:10:23.454Z',
            parentId   : '5b7a0e03b967e171cd0ae99c',
            code       : 'UK',
            currency   : 'GBP',
            desc       : 'The United Kingdom Update3a',
            lang       : 'en-GB',
            name       : 'United Kingdom Updated',
            phoneCode  : 44,
            timezone   : '',
            lat        : 0,
            long       : 0,
            category   : 'Country'
        }
    ],
    existParamsUpdate = [
        {
            _id     : {$ne: new ObjectId('5b57f583b3db46019a22bd9d')},
            code    : 'GB',
            parentId: '5b7a0e03b967e171cd0ae99c'
        }
    ],
    queryParams = {},
    docIds: Array<string> = [],
    options = {
        logCreate: true,
        logUpdate: true,
    };

(async () => {
    // pre-testing setup
    let dbServer = await newDbMongo(dbs.mongodb);
    let appDb = await dbServer.openDb(dbName);
    let params: CrudTaskType = {
        appDb       : appDb,
        coll        : coll,
        userInfo    : userInfo,
        actionParams: actionParams,
        existParams : existParamsCreate,
        queryParams : queryParams,
        docIds      : docIds,
        token       : "",
    }

    // perform audit-log test tasks
    await mcTest({
        name    : "should connect and return valid instance record, with new call: ",
        testFunc: async () => {
            const crud = new SaveRecord(params, options);
            assertEquals(typeof crud, "object");
            assertEquals(Object.keys(crud).length > 0, true);
        },
    });
    await mcTest({
        name    : "should connect and return valid instance record, with function-call: ",
        testFunc: async () => {
            const crud = newSaveRecord(params, options);
            assertEquals(typeof crud, "object");
            assertEquals(Object.keys(crud).length > 0, true);
        },
    });
    await mcTest({
        name    : "should successfully create new record: ",
        testFunc: async () => {
            const crud = newSaveRecord(params, options);
            const res: ResponseMessage = await crud.saveRecord();
            const resResult = (res.code === "success" || res.code === "exists");
            assertEquals(resResult, true);
        },
    });
    await mcTest({
        name    : "should successfully update existing record: ",
        testFunc: async () => {
            params = {
                appDb       : appDb,
                coll        : coll,
                userInfo    : userInfo,
                actionParams: actionParamsUpdate,
                existParams : existParamsUpdate,
                queryParams : queryParams,
                docIds      : docIds,
                token       : "",
            }
            const crud = newSaveRecord(params, options);
            const res: ResponseMessage = await crud.saveRecord();
            const resResult = (res.code === "success" || res.code === "exists");
            assertEquals(resResult, true);
        },
    });
    await mcTest({
        name    : "should return paramsError, with null param(s): ",
        testFunc: async () => {
            params = {
                appDb       : appDb,
                coll        : "",
                userInfo    : userInfo,
                actionParams: actionParamsUpdate,
                existParams : existParamsUpdate,
                queryParams : queryParams,
                docIds      : docIds,
                token       : "",
            }
            const crud = newSaveRecord(params, options);
            const res: ResponseMessage = await crud.saveRecord();
            assertEquals(res.code, "paramsError");
        },
    });
    await mcTest({
        name    : "create: should passed the null value for Id, return exists: ",
        testFunc: async () => {
            params = {
                appDb       : appDb,
                coll        : coll,
                userInfo    : userInfo,
                actionParams: actionParams,
                existParams : existParamsCreate,
                queryParams : queryParams,
                docIds      : docIds,
                token       : "",
            }
            const crud = newSaveRecord(params, options);
            const res: ResponseMessage = await crud.saveRecord();
            assertEquals(res.code, "exists");
        },
    });

    // post testing report
    await postTestResult();

    // close resources / avoid memory leak
    await dbServer?.closeDb();
})();
