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
    tokenId     : 'db7f01756bf65a089bea259ae0ebfcf50dfeb9140e614d7903de48c4cf0f52db',
    testUserInfo: {
        token    : "db7f01756bf65a089bea259ae0ebfcf50dfeb9140e614d7903de48c4cf0f52db",
        group    : "5b4543a417d6841d393e0e99",
        email    : "abbeya1@yahoo.com",
        firstName: "Abi",
        language : "en-US",
        lastName : "Akindele",
        loginName: "abbeya1@yahoo.com",
        userId   : "5b0e139b3151184425aae01c",
        expire   : 0,
    },
};

export const userInfo: UserInfoType = {
    token    : "db7f01756bf65a089bea259ae0ebfcf50dfeb9140e614d7903de48c4cf0f52db",
    group    : "5b4543a417d6841d393e0e99",
    email    : "abbeya1@yahoo.com",
    firstName: "Abi",
    language : "en-US",
    lastName : "Akindele",
    loginName: "abbeya1@yahoo.com",
    userId   : "5b0e139b3151184425aae01c",
    expire   : 0,
};

export const inValidUserInfo: UserInfoType = {
    token    : "",
    group    : "5b4543a417d6841d393e0e99",
    email    : "abbeya1@yahoo.com",
    firstName: "Abi",
    language : "en-US",
    lastName : "Akindele",
    loginName: "abbeya1@yahoo.com",
    userId   : "5b0e139b3151184425aae09c",
    expire   : 0,
};

export const token = "db7f01756bf65a089bea259ae0ebfcf50dfeb9140e614d7903de48c4cf0f52db";
