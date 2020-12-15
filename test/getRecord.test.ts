/**
 * @Author: abbeymart | Abi Akindele | @Created: 2020-07-26
 * @Company: Copyright 2020 Abi Akindele  | mConnect.biz
 * @License: All Rights Reserved | LICENSE.md
 * @Description: mc-central-ts: getRecord testing
 */

import { mcTest, assertEquals, postTestResult } from "../../mc-test";
import { userInfo, dbName } from "./appUser";
import { newDbMongo } from "../../mc-db/src";
import { dbs } from "../../mc-db/test/config/dbConfig";
import { GetRecord, newGetRecord } from "..";
import { CrudTaskType } from "../src/types";

let coll = "locations",
    docIds1 = ['5b57f583b3db46019a22bd9c'],
    docIds = ['5b57f583b3db46019a22bd9c', '5b57f583b3db46019a22bd9d'],
    queryParams = {},
    projectParams = {},
    sortParams = {},
    options = {
        logRead: true,
    };

(async () => {
    // pre-testing setup
    let dbServer = await newDbMongo(dbs.mongodb);
    let appDb = await dbServer.openDb(dbName);
    let params: CrudTaskType = {
        appDb        : appDb,
        coll         : coll,
        userInfo     : userInfo,
        queryParams  : queryParams,
        docIds       : [],
        projectParams: projectParams,
        sortParams   : sortParams,
        token        : "",
    };

    // perform audit-log test tasks
    await mcTest({
        name    : "should connect and return valid instance record, with new call: ",
        testFunc: async () => {
            const crud = new GetRecord(params, options);
            assertEquals(typeof crud, "object");
            assertEquals(Object.keys(crud).length > 0, true);
        },
    });
    await mcTest({
        name    : "should connect and return valid instance record, with function-call: ",
        testFunc: async () => {
            const crud = newGetRecord(params, options);
            assertEquals(typeof crud, "object");
            assertEquals(Object.keys(crud).length > 0, true);
        },
    });
    await mcTest({
        name    : "should return valid # of records: ",
        testFunc: async () => {
            const crud = newGetRecord(params, options);
            const res = await crud.getRecord();
            console.log('response code: ', res.code);
            console.log("response-value-count: ", res.value.length);
            assertEquals(res.value.length > 0, true);
        },
    });
    await mcTest({
        name    : "should return valid # of records from cache: ",
        testFunc: async () => {
            const crud = newGetRecord(params, options);
            const res = await crud.getRecord();
            console.log('response code: ', res.code);
            console.log("response-value-count: ", res.value.length);
            assertEquals(res.message, "from cache");
            assertEquals(res.value.length > 0, true);
        },
    });
    await mcTest({
        name    : "should return valid # of records, by queryParams: ",
        testFunc: async () => {
            params = {
                appDb        : appDb,
                coll         : coll,
                userInfo     : userInfo,
                queryParams  : {code: "US",},
                docIds       : [],
                projectParams: projectParams,
                sortParams   : sortParams,
                token        : "",
            };
            const crud = newGetRecord(params, options);
            const res = await crud.getRecord();
            assertEquals(res.value.length > 0, true);
        },
    });
    await mcTest({
        name    : "should return valid # of records, by docId(1): ",
        testFunc: async () => {
            params = {
                appDb        : appDb,
                coll         : coll,
                userInfo     : userInfo,
                queryParams  : {},
                docIds       : docIds1,
                projectParams: projectParams,
                sortParams   : sortParams,
                token        : "",
            };
            const crud = newGetRecord(params, options);
            const res = await crud.getRecord();
            assertEquals(res.value.length === 1, true);
        },
    });
    await mcTest({
        name    : "should return valid # of records, by docId(>1): ",
        testFunc: async () => {
            params = {
                appDb        : appDb,
                coll         : coll,
                userInfo     : userInfo,
                queryParams  : {},
                docIds       : docIds,
                projectParams: projectParams,
                sortParams   : sortParams,
                token        : "",
            };
            const crud = newGetRecord(params, options);
            const res = await crud.getRecord();
            assertEquals(res.value.length === 2, true);
        },
    });

    await mcTest({
        name    : "should return paramsError, for invalid param (coll...): ",
        testFunc: async () => {
            params = {
                appDb        : appDb,
                coll         : "",
                userInfo     : userInfo,
                queryParams  : {},
                docIds       : docIds1,
                projectParams: projectParams,
                sortParams   : sortParams,
                token        : "",
            };
            const crud = newGetRecord(params, options);
            const res = await crud.getRecord();
            assertEquals(res.code, "paramsError");
        },
    });
    // post testing report
    await postTestResult();

    // close resources / avoid memory leak
    await dbServer?.closeDb();
})();

