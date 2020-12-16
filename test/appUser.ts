/**
 * @Author: abbeymart | Abi Akindele | @Created: 2020-07-26
 * @Company: Copyright 2020 Abi Akindele  | mConnect.biz
 * @License: All Rights Reserved | LICENSE.md
 * @Description: mc-central-ts: bookmark socket.io
 */
import { UserInfoType } from "../src";

export const dbs = {
    mongodb: {
        location: process.env.MONGODB_URL || "mongodb://localhost:27017/mc-central",
        host    : process.env.MONGODB_HOST || "localhost",
        username: process.env.MONGODB_USER || "abbeymart",
        password: process.env.MONGODB_PWD || "ab12testing",
        database: process.env.MONGODB_DBNAME || "mc-central",
        port    : process.env.MONGODB_PORT || 27017,
    }

}

export const dbName = "mc-central";

export const appUser = {
    tokenId     : '583d3d40d68b165c001e236a50936b9c1852fe7b53c2e46c9ef93d21649ee77b',
    testUserInfo: {
        loginName: "abbeya1@yahoo.com",
        email    : "abbeya1@yahoo.com",
        userId: "5b0e139b3151184425aae01c",
        expire: 1608174360299,
        firstName: "Abi",
        language: "en-US",
        lastName: "Akindele",
        token: "583d3d40d68b165c001e236a50936b9c1852fe7b53c2e46c9ef93d21649ee77b",
    },
};

export const userInfo: UserInfoType = {
    loginName: "abbeya1@yahoo.com",
    email    : "abbeya1@yahoo.com",
    userId: "5b0e139b3151184425aae01c",
    expire: 1608174360299,
    firstName: "Abi",
    language: "en-US",
    lastName: "Akindele",
    token: "583d3d40d68b165c001e236a50936b9c1852fe7b53c2e46c9ef93d21649ee77b",
};

export const inValidUserInfo: UserInfoType = {
    loginName: "abbeya1@yahoo.com",
    email    : "abbeya1@yahoo.com",
    userId: "5b0e139b3151184425aae01c",
    expire: 0,
    firstName: "Abi",
    language: "en-US",
    lastName: "Akindele",
    token: "",
};

export const token = "583d3d40d68b165c001e236a50936b9c1852fe7b53c2e46c9ef93d21649ee77b";
