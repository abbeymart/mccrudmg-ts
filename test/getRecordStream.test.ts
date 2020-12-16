/**
 * @Author: abbeymart | Abi Akindele | @Created: 2020-07-26
 * @Company: Copyright 2020 Abi Akindele  | mConnect.biz
 * @License: All Rights Reserved | LICENSE.md
 * @Description: mc-central-ts: getRecordStream testing
 */

import { mcTest, assertEquals, postTestResult } from "@mconnect/mctest";
import { userInfo, dbName, dbs } from "./appUser";
import { newDbMongo } from "@mconnect/mcdb";
import { GetRecordStream, newGetRecordStream } from "../src";
import { CrudTaskType } from "../src/types";
import { Cursor } from "mongodb";

let coll = "locations",
    docIds = ['5b57f583b3db46019a22bd9c', '5b57f583b3db46019a22bd9d'],
    queryParams = {},
    projectParams = {},
    sortParams = {},
    options = {};

(async () => {
    // pre-testing setup
    let dbServer = await newDbMongo(dbs.mongodb);
    let appDb = await dbServer.openDb(dbName);
    let params: CrudTaskType = {
        appDb        : appDb,
        coll         : coll,
        userInfo     : userInfo,
        queryParams  : queryParams,
        docIds       : docIds,
        projectParams: projectParams,
        sortParams   : sortParams,
        token        : "",
    };

    // perform audit-log test tasks
    await mcTest({
        name    : "should connect and return valid instance record, with new call: ",
        testFunc: async () => {
            const crud = new GetRecordStream(params, options);
            assertEquals(typeof crud, "object");
            assertEquals(Object.keys(crud).length > 0, true);
        },
    });
    await mcTest({
        name    : "should connect and return valid instance record, with function-call: ",
        testFunc: async () => {
            const crud = newGetRecordStream(params, options);
            assertEquals(typeof crud, "object");
            assertEquals(Object.keys(crud).length > 0, true);
        },
    });
    await mcTest({
        name    : "should stream/return valid # of all records: ",
        testFunc: async () => {
            let resItems: Array<any> = [];
            const crud = newGetRecordStream(params, options);
            const res: Cursor = await crud.getRecordStream();
            await res.forEach((dataRec) => {
                resItems.push(dataRec);
            });
            // console.log('stream-recs: ', resItems);
            assertEquals(resItems.length > 0, true);
        },
    });
    await mcTest({
        name    : "should stream/return valid # of records(4), by docId: ",
        testFunc: async () => {
            params = {
                appDb        : appDb,
                coll         : coll,
                userInfo     : userInfo,
                queryParams  : queryParams,
                docIds       : ['5b57f583b3db46019a22bd9c',
                    '5b57f583b3db46019a22bd9d',
                    '5b57f583b3db46019a22bd9e',
                    '5b57f583b3db46019a22bd9f', // US, UK, JP, NG
                ],
                projectParams: projectParams,
                sortParams   : sortParams,
                token        : "",
            };
            let resItems: Array<any> = [];
            const crud = newGetRecordStream(params, options);
            const res: Cursor = await crud.getRecordStream();
            await res.forEach((dataRec) => {
                resItems.push(dataRec);
            });
            // console.log('stream-recs: ', resItems);
            assertEquals(resItems.length === 4, true);
        },
    });
    await mcTest({
        name    : "should return valid # of records, by queryParams: ",
        testFunc: async () => {
            params = {
                appDb        : appDb,
                coll         : coll,
                userInfo     : userInfo,
                queryParams  : {code: "US"},
                docIds       : [],
                projectParams: projectParams,
                sortParams   : sortParams,
                token        : "",
            };
            let resItems: Array<any> = [];
            const crud = newGetRecordStream(params, options);
            const res: Cursor = await crud.getRecordStream();
            for await (const data of res){
                resItems.push(data);
            }
            // await res.forEach((dataRec) => {
            //     resItems.push(dataRec);
            // });
            console.log('stream-recs: ', resItems);
            assertEquals(resItems.length === 1, true);
        },
    });
    await mcTest({
        name    : "should return paramsError, for invalid param (coll...): ",
        testFunc: async () => {
            params = {
                appDb        : appDb,
                coll         : "",
                userInfo     : userInfo,
                queryParams  : queryParams,
                docIds       : [],
                projectParams: projectParams,
                sortParams   : sortParams,
                token        : "",
            };
            try {
                const crud = newGetRecordStream(params, options);
                const res: Cursor = await crud.getRecordStream();
                await res.forEach((dataRec) => {
                    console.dir( dataRec );
                    // assertEquals(res.code, "paramsError");
                });
            } catch (e) {
                assertEquals(e.message, "coll : Information item is required");
            }
        },
    });
    // post testing report
    await postTestResult();

    // close resources / avoid memory leak
    await dbServer?.closeDb();
})();
