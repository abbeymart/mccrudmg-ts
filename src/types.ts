/**
 * @Author: abbeymart | Abi Akindele | @Created: 2020-07-23
 * @Company: Copyright 2020 Abi Akindele  | mConnect.biz
 * @License: All Rights Reserved | LICENSE.md
 * @Description: mc-central-ts: CRUD types
 */

import { AuditLogMongo } from "@mconnect/mcauditlog";
import { Db, ObjectId } from "mongodb";
import {ModelOptionsType} from "./model";

export type MongoDbConnectType = Db;

export enum TaskTypes {
    CREATE,
    INSERT,
    UPDATE,
    READ,
    DELETE,
    REMOVE,
}

export interface UserInfoType {
    userId: string;
    firstName: string;
    lastName: string;
    language: string;
    loginName: string;
    token: string;
    expire: number;
    group?: string;
    email?: string;
}

export interface OkResponse {
    ok: boolean;
}

export interface RoleServiceType {
    serviceId: string;
    roleId: string;
    serviceCategory: string;
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    collAccessPermitted?: boolean;
}

export interface CheckAccessType {
    userId: string;
    group: string;
    groups: Array<string>;
    isActive: boolean;
    isAdmin: boolean;
    roleServices: Array<RoleServiceType>;
    collId: string;
}

export interface RoleFuncType {
    (it1: string, it2: RoleServiceType): boolean;
}

export type FieldValueTypes =
    string
    | number
    | boolean
    | object
    | Array<string>
    | Array<number>
    | Array<boolean>
    | Array<object>;

export type PromiseResponseType = Promise<string>
    | Promise<number>
    | Promise<boolean>
    | Promise<Array<string>>
    | Promise<Array<number>>
    | Promise<Array<boolean>>
    | Promise<Array<object>>;

// ModelValue will be validated based on the Model definition
export interface ValueParamsType {
    [key: string]: FieldValueTypes;         // fieldName: fieldValue, must match fieldType (re: validate) in model definition
}

export type ActionParamsType = Array<ValueParamsType>;  // documents for create or update task/operation

export interface QueryParamsType {
    [key: string]: any;
}

export interface ExistParamItemType {
    [key: string]: any;
}

export type ExistParamsType = Array<ExistParamItemType>;

export interface ProjectParamsType {
    [key: string]: number | boolean; // 1 or true for inclusion, 0 or false for exclusion
}

export interface SortParamsType {
    [key: string]: number;          // 1 for "asc", -1 for "desc"
}

export interface ActionParamTaskType {
    createItems: ActionParamsType;
    updateItems: ActionParamsType;
    docIds: Array<string>;
}

export interface CrudParamType {
    appDb: MongoDbConnectType;
    coll: string;
    token?: string;
    userInfo?: UserInfoType;
    userId?: string;
    group?: string;
    groups?: Array<string>;
    docIds?: Array<any>;
    actionParams: ActionParamsType;
    queryParams?: QueryParamsType;
    existParams?: ExistParamsType;
    projectParams?: ProjectParamsType;
    sortParams?: SortParamsType;
    skip?: number;
    limit?: number;
    parentColls?: Array<string>;
    childColls?: Array<string>;
    recursiveDelete?: boolean;
    checkAccess?: boolean;
    accessDb: MongoDbConnectType;
    auditDb: MongoDbConnectType;
    auditColl?: string;
    serviceColl?: string;
    userColl?: string;
    roleColl?: string;
    accessColl?: string;
    maxQueryLimit?: number;
    logAll?: boolean;
    logCreate?: boolean;
    logUpdate?: boolean;
    logRead?: boolean;
    logDelete?: boolean;
    transLog: AuditLogMongo;
    hashKey: string;
    isRecExist?: boolean;
    actionAuthorized?: boolean;
    unAuthorizedMessage?: string;
    recExistMessage?: string;
    isAdmin?: boolean;
    createItems?: Array<object>;
    updateItems?: Array<object>;
    currentRecs?: Array<object>;
    roleServices?: Array<RoleServiceType>;
    subItems: Array<boolean>;
    cacheExpire?: number;
    params: CrudTaskType;
}

export interface CrudTaskType {
    appDb: MongoDbConnectType;
    coll: string;
    userInfo?: UserInfoType;
    actionParams?: ActionParamsType;
    existParams?: ExistParamsType;
    queryParams?: QueryParamsType;
    docIds?: Array<string | ObjectId>;
    projectParams?: ProjectParamsType;
    sortParams?: SortParamsType;
    token?: string;
    options?: CrudOptionsType;
    taskName?: string;
}

export interface CrudOptionsType {
    skip?: number;
    limit?: number;
    parentColls?: Array<string>;
    childColls?: Array<string>;
    recursiveDelete?: boolean;
    checkAccess?: boolean;
    accessDb?: MongoDbConnectType;
    auditDb?: MongoDbConnectType;
    serviceDb?: MongoDbConnectType;
    auditColl?: string;
    serviceColl?: string;
    userColl?: string;
    roleColl?: string;
    accessColl?: string;
    verifyColl?: string;
    maxQueryLimit?: number;
    logAll?: boolean;
    logCreate?: boolean;
    logUpdate?: boolean;
    logRead?: boolean;
    logDelete?: boolean;
    logLogin?: boolean;
    logLogout?: boolean;
    unAuthorizedMessage?: string;
    recExistMessage?: string;
    cacheExpire?: number;
    modelOptions?: ModelOptionsType;
    loginTimeout?: number;
    usernameExistsMessage?: string;
    emailExistsMessage?: string
    msgFrom?: string;
}
