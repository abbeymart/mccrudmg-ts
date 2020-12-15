/**
 * @Author: abbeymart | Abi Akindele | @Created: 2020-02-21 | @Updated: 2020-05-28
 * @Company: mConnect.biz | @License: MIT
 * @Description: crud-mg base class, for all CRUD operations
 */

// Import required module/function(s)/types
import { ObjectId } from "mongodb";
import {
    MongoDbConnectType,
    UserInfoType,
    CrudOptionsType,
    RoleServiceType,
    CheckAccessType,
    TaskTypes, RoleFuncType, OkResponse, CrudTaskType,
} from "./types";
import { AuditLogMongo, newAuditLogMongo } from "../../mc-auditlog/src";
import { getResMessage, ResponseMessage } from "../../mc-response";

class Crud {
    protected params: CrudTaskType;
    protected appDb: MongoDbConnectType;
    protected coll: string;
    protected token: string;
    protected userInfo: UserInfoType;
    protected docIds: Array<any>;       // to capture string-id | ObjectId
    protected actionParams: Array<object>;
    protected queryParams: object;
    protected existParams: Array<object>;
    protected projectParams: object;
    protected sortParams: object;
    protected skip: number;
    protected limit: number;
    protected recursiveDelete: boolean;
    protected accessDb: MongoDbConnectType;
    protected auditDb: MongoDbConnectType;
    protected auditColl: string;
    protected serviceColl: string;
    protected userColl: string;
    protected roleColl: string;
    protected accessColl: string;
    protected maxQueryLimit: number;
    protected logAll: boolean;
    protected logCreate: boolean;
    protected logUpdate: boolean;
    protected logRead: boolean;
    protected logDelete: boolean;
    protected transLog: AuditLogMongo;
    protected hashKey: string;
    protected checkAccess: boolean;
    protected userId: string;
    protected isAdmin: boolean;
    protected isActive: boolean;
    protected createItems: Array<object>;
    protected updateItems: Array<object>;
    protected currentRecs: Array<object>;
    protected roleServices: Array<RoleServiceType>;
    protected isRecExist: boolean;
    protected actionAuthorized: boolean;
    protected recExistMessage: string;
    protected unAuthorizedMessage: string;
    protected subItems: Array<boolean>;
    protected cacheExpire: number;
    protected parentColls: Array<string>;
    protected childColls: Array<string>;

    constructor(params: CrudTaskType, options?: CrudOptionsType) {
        // crudParams
        this.params = params;
        this.appDb = params.appDb;
        this.coll = params.coll;
        this.actionParams = params && params.actionParams ? params.actionParams : [];
        this.queryParams = params && params.queryParams ? params.queryParams : {};
        this.existParams = params && params.existParams ? params.existParams : [];
        this.projectParams = params && params.projectParams ? params.projectParams : {};
        this.sortParams = params && params.sortParams ? params.sortParams : {};
        this.docIds = params && params.docIds ? params.docIds : [];
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
        this.hashKey = JSON.stringify({
            coll         : this.coll,
            queryParams  : this.queryParams,
            projectParams: this.projectParams,
            sortParams   : this.sortParams,
            docIds       : this.docIds
        });
        // options
        this.skip = options && options.skip ? options.skip : 0;
        this.limit = options && options.limit ? options.limit : 10000;
        this.parentColls = options && options.parentColls ? options.parentColls : [];
        this.childColls = options && options.childColls ? options.childColls : [];
        this.recursiveDelete = options && options.recursiveDelete || false;
        this.checkAccess = options && options.checkAccess ? options.checkAccess : false;
        this.auditColl = options && options.auditColl ? options.auditColl : "audits";
        this.serviceColl = options && options.serviceColl ? options.serviceColl : "services";
        this.accessColl = options && options.accessColl ? options.accessColl : "accessKeys";
        this.userColl = options && options.userColl ? options.userColl : "users";
        this.roleColl = options && options.roleColl ? options.roleColl : "roles";
        this.accessDb = options && options.accessDb ? options.accessDb : this.appDb;
        this.auditDb = options && options.auditDb ? options.auditDb : this.appDb;
        this.maxQueryLimit = options && options.maxQueryLimit ? options.maxQueryLimit : 10000;
        this.logAll = options && options.logAll ? options.logAll : false;
        this.logCreate = options && options.logCreate ? options.logCreate : false;
        this.logUpdate = options && options.logUpdate ? options.logUpdate : false;
        this.logRead = options && options.logRead ? options.logRead : false;
        this.logDelete = options && options.logDelete ? options.logDelete : false;
        this.cacheExpire = options && options.cacheExpire ? options.cacheExpire : 300;

        // auditLog constructor / instance
        this.transLog = newAuditLogMongo(this.auditDb, {
            auditColl: this.auditColl,
        });
        // standard defaults
        this.isAdmin = false;
        this.isActive = false;
        this.createItems = [];
        this.updateItems = [];
        this.currentRecs = [];
        this.roleServices = [];
        this.subItems = [];
        this.isRecExist = true;
        this.actionAuthorized = false;
        this.recExistMessage = "Save / update error or duplicate records exist: ";
        this.unAuthorizedMessage = "Action / task not authorised or permitted ";
    }

    checkDb(dbConnect: MongoDbConnectType): ResponseMessage {
        if (dbConnect && dbConnect.databaseName !== "") {
            return getResMessage("success", {
                message: "valid database connection/handler",
            });
        } else {
            return getResMessage("validateError", {
                message: "valid database connection/handler is required",
            });
        }
    }

    async checkRecExist(): Promise<ResponseMessage> {
        // check if items/records exist: uniqueness
        try {
            if (this.existParams && Array.isArray(this.existParams)) {
                const appDbColl = this.appDb.collection(this.coll);
                let attributesMessage = "";
                for (const existItem of this.existParams) {
                    let recordExist = await appDbColl.findOne(existItem);
                    if (recordExist) {
                        this.isRecExist = true;
                        // capture attributes for any duplicate-document
                        Object.entries(existItem)
                            .forEach(([key, value]) => {
                                attributesMessage = attributesMessage ? `${attributesMessage} | ${key}: ${value}` : `${key}: ${value}`;
                            });
                        // stop the loop/iteration, once a duplicate-document was found
                        break;
                    } else {
                        this.isRecExist = false;
                    }
                }
                if (this.isRecExist) {
                    return getResMessage("recExist", {
                        message: `Record with similar combined attributes [${attributesMessage}] exists. Provide unique record attributes to create or update record(s).`,
                    });
                } else {
                    return getResMessage("success", {
                        message: "no integrity conflict",
                    });
                }
            } else {
                return getResMessage("saveError", {
                    message: "Integrity condition not specified/missing: unable to verify integrity conflict",
                });
            }
        } catch (e) {
            console.error(e);
            return getResMessage("saveError", {
                message: "unable to verify integrity conflict",
            });
        }
    }

    async getCurrentRecord(): Promise<ResponseMessage> {
        // current records, prior to update, for audit-log
        try {
            const appDbColl = this.appDb.collection(this.coll);
            const currentRecords = await appDbColl.find({
                _id: {
                    $in: this.docIds
                }
            }).toArray();

            if (currentRecords.length > 0 && currentRecords.length === this.docIds.length) {
                // update crud instance value
                this.currentRecs = currentRecords;
                return getResMessage("success", {
                    message: "record exists for update",
                });
            } else if (currentRecords.length < this.docIds.length ) {
                return getResMessage("notFound", {
                    message: `Only ${currentRecords.length} out of ${this.docIds.length} update-requested-records were found`,
                });
            } else {
                return getResMessage("notFound", {
                    message: "Record(s) requested for updates, not found.",
                });
            }
        } catch (e) {
            console.error(e);
            return getResMessage("notFound", {
                message: "Error finding the record(s) requested for updates.",
            });
        }
    }

    async getCurrentRecordByParams(): Promise<ResponseMessage> {
        // current records, prior to update, for audit-log
        try {
            const appDbColl = this.appDb.collection(this.coll);
            const currentRecords = await appDbColl.find(this.queryParams).toArray();
            if (currentRecords.length > 0) {
                this.currentRecs = currentRecords;
                return getResMessage("success", {
                    message: "record exists for update",
                });
            } else {
                return getResMessage("notFound", {
                    message: "Record(s) requested for updates, not found.",
                });
            }
        } catch (e) {
            return getResMessage("notFound", {
                message: "Record(s) requested for updates, not found.",
            });
        }
    }

    // getRoleServices returns the role-service documents/records for the authorized user
    async getRoleServices(accessDb: MongoDbConnectType,
                          group: string,
                          serviceIds: Array<string>,   // for serviceCategory (record, coll/table, function, package, solution...)
                          roleColl: string = "roles"): Promise<Array<RoleServiceType>> {
        let roleServices: Array<RoleServiceType> = [];
        try {
            // db connection
            const coll = accessDb.collection(roleColl);
            const result = await coll.find({
                group    : group,
                serviceId: {$in: serviceIds},
                isActive : true
            }).toArray();

            if (result.length > 0) {
                for (const doc of result) {
                    roleServices.push({
                        serviceId      : doc.serviceId,
                        roleId         : doc.roleId,
                        serviceCategory: doc.serviceCategory,
                        canRead        : doc.canRead,
                        canCreate      : doc.canCreate,
                        canUpdate      : doc.canUpdate,
                        canDelete      : doc.canDelete,
                    });
                }
            }
            return roleServices;
        } catch (e) {
            return roleServices;
        }
    }

    // checkAccess validate if current CRUD task is permitted based on defined/assigned roles
    async checkTaskAccess(accessDb: MongoDbConnectType,
                          userInfo: UserInfoType,
                          coll: string,
                          docIds: Array<string> = [],   // for update, delete and read tasks
                          accessColl: string = "accessKeys",
                          userColl: string = "users",
                          roleColl: string = "roles",
                          serviceColl: string = "services"): Promise<ResponseMessage> {
        // validate current user active status: by token (API) and user/loggedIn-status
        try {
            const accessDbColl = accessDb.collection(accessColl);
            // get the accessKey information for the user
            const accessRes = await accessDbColl.findOne({
                userId   : new ObjectId(userInfo.userId),
                token    : userInfo.token,
                loginName: userInfo.loginName
            });

            // console.log("access-record: ", accessRes)
            if (accessRes) {
                if (Date.now() > accessRes.expire) {
                    return getResMessage("tokenExpired", {message: "Access expired: please login to continue"});
                }
            } else {
                return getResMessage("unAuthorized", {message: "Unauthorized: please ensure that you are logged-in"});
            }

            // check current current-user status/info
            const userDbColl = accessDb.collection(userColl);
            let group = "";
            const userRes = await userDbColl.findOne({_id: new ObjectId(userInfo.userId), isActive: true});
            if (!userRes) {
                return getResMessage("unAuthorized", {message: "Unauthorized: user information not found or inactive"});
            } else {
                group = userRes.group;
            }

            // if all the above checks passed, check for role-services access by taskType
            // obtain collName/collId (_id) from serviceColl (repo for all resources)
            const serviceDbColl = accessDb.collection(serviceColl);
            const serviceRes = await serviceDbColl.findOne({name: coll});

            // # if permitted, include collId and docIds in serviceIds
            let collId = "";
            let serviceIds = docIds;
            if (serviceRes && serviceRes.category.toLowerCase() === "collection") {
                collId = serviceRes._id;
                serviceIds.push(serviceRes._id);
            }

            let roleServices: Array<RoleServiceType> = [];
            if (serviceIds.length > 0) {
                roleServices = await this.getRoleServices(accessDb, group, serviceIds, roleColl)
            }

            let permittedRes: CheckAccessType = {
                userId      : userRes._id,
                group       : userRes.group,
                groups      : userRes.groups,
                isActive    : userRes.isActive,
                isAdmin     : userRes.isAdmin || false,
                roleServices: roleServices,
                collId      : collId,
            }
            return getResMessage("success", {value: permittedRes});
        } catch (e) {
            console.error("check-access-error: ", e);
            return getResMessage("unAuthorized", {message: e.message});
        }
    }

    // taskPermission determines if the current CRUD task is permitted
    // permission options: by owner, by record/role-assignment, by table/collection or by admin
    async taskPermission(taskType: TaskTypes): Promise<ResponseMessage> {
        // taskType: "create", "update", "delete"/"remove", "read"
        // permit task(crud): by owner, role/group (on coll/table or doc/record(s)) or admin
        try {
            // # validation access variables
            let taskPermitted = false,
                ownerPermitted = false,
                recordPermitted = false,
                collPermitted = false,
                isAdmin = false,
                isActive = false,
                userId = "",
                group = "",
                groups = [],
                collId = "",
                roleServices = [];

            // check role-based access
            const accessRes = await this.checkTaskAccess(this.accessDb, this.userInfo, this.coll, this.docIds);
            if (accessRes.code !== "success") {
                return accessRes;
            }

            // capture roleServices value
            // get access info value
            let accessInfo = accessRes.value;
            let accessUserId = accessInfo.userId;
            let docIds: Array<string> = [];

            // determine records/documents ownership
            if (this.docIds && this.docIds.length > 0 && accessUserId && accessInfo.isActive) {
                docIds = this.docIds;
                const appDbColl = this.appDb.collection(this.coll);

                const ownedRecs = await appDbColl.find({
                    _id      : {$in: this.docIds},
                    createdBy: accessUserId
                }).toArray();
                // check if the current-user owned all the current-documents (docIds)
                if (ownedRecs.length === this.docIds.length) {
                    ownerPermitted = true;
                }
            }
            isAdmin = accessInfo.isAdmin;
            isActive = accessInfo.isActive;
            roleServices = accessInfo.roleServices;
            userId = accessInfo.userId;
            group = accessInfo.group;
            groups = accessInfo.groups;
            collId = accessInfo.collId;

            // validate active status
            if (!isActive) {
                return getResMessage("unAuthorized", {message: "Account is not active. Validate active status"});
            }
            // validate roleServices permission, for non-admin users
            if (!isAdmin && roleServices.length < 1) {
                return getResMessage("unAuthorized", {message: "You are not authorized to perform the requested action/task"});
            }

            // filter the roleServices by categories ("collection | table" and "record or document")
            const collTabFunc = (item: RoleServiceType): boolean => {
                return (item.serviceCategory === collId);
            }

            const recordFunc = (item: RoleServiceType): boolean => {
                return (docIds.includes(item.serviceCategory));
            }

            let roleColls: Array<RoleServiceType> = [];
            let roleDocs: Array<RoleServiceType> = [];
            if (roleServices.length > 0) {
                roleColls = roleServices.filter(collTabFunc);
                roleDocs = roleServices?.filter(recordFunc);
            }

            // helper functions
            const canCreateFunc = (item: RoleServiceType): boolean => {
                return item.canCreate
            }

            const canUpdateFunc = (item: RoleServiceType): boolean => {
                return item.canUpdate;
            }

            const canDeleteFunc = (item: RoleServiceType): boolean => {
                return item.canDelete;
            }

            const canReadFunc = (item: RoleServiceType): boolean => {
                return item.canRead;
            }

            const roleUpdateFunc = (it1: string, it2: RoleServiceType): boolean => {
                return (it2.serviceId === it1 && it2.canUpdate);
            }

            const roleDeleteFunc = (it1: string, it2: RoleServiceType): boolean => {
                return (it2.serviceId === it1 && it2.canUpdate);
            }

            const roleReadFunc = (it1: string, it2: RoleServiceType): boolean => {
                return (it2.serviceId === it1 && it2.canUpdate);
            }

            const docFunc = (it1: string, roleFunc: RoleFuncType): boolean => {
                return roleDocs.some((it2: RoleServiceType) => roleFunc(it1, it2));
            }

            // taskType specific permission(s)
            if (!isAdmin && roleServices.length > 0) {
                switch (taskType) {
                    case TaskTypes.CREATE:
                    case TaskTypes.INSERT:
                        // collection/table level access | only tableName Id was included in serviceIds
                        if (roleColls.length > 0) {
                            collPermitted = roleColls.every(canCreateFunc);
                        }
                        break;
                    case TaskTypes.UPDATE:
                        // collection/table level access
                        if (roleColls.length > 0) {
                            collPermitted = roleColls.every(canUpdateFunc);
                        }
                        // document/record level access: all docIds must have at least a match in the roleRecords
                        if (docIds.length > 0) {
                            recordPermitted = docIds.every(it1 => docFunc(it1, roleUpdateFunc));
                        }
                        break;
                    case TaskTypes.DELETE:
                    case TaskTypes.REMOVE:
                        // collection/table level access
                        if (roleColls.length > 0) {
                            collPermitted = roleColls.every(canDeleteFunc);
                        }
                        // document/record level access: all docIds must have at least a match in the roleRecords
                        if (docIds.length > 0) {
                            recordPermitted = docIds.every(it1 => docFunc(it1, roleDeleteFunc));
                        }
                        break;
                    case TaskTypes.READ:
                        // collection/table level access
                        if (roleColls.length > 0) {
                            collPermitted = roleColls.every(canReadFunc);
                        }
                        // document/record level access: all docIds must have at least a match in the roleRecords
                        if (docIds.length > 0) {
                            recordPermitted = docIds.every(it1 => docFunc(it1, roleReadFunc));
                        }
                        break;
                    default:
                        return getResMessage("unAuthorized", {message: "Unknown access type or access type not specified"});
                }
            }

            // overall access permitted
            taskPermitted = recordPermitted || collPermitted || ownerPermitted || isAdmin;
            const ok: OkResponse = {ok: taskPermitted};
            const value = {...ok, ...{isAdmin, isActive, userId, group, groups}};
            if (taskPermitted) {
                return getResMessage("success", {value: value, message: "action authorised / permitted"});
            } else {
                return getResMessage("unAuthorized", {
                    value  : ok,
                    message: "You are not authorized to perform the requested action/task"
                });
            }
        } catch (e) {
            const ok: OkResponse = {ok: false};
            return getResMessage("unAuthorized", {value: ok});
        }
    }

    async taskPermissionByParams(taskType: TaskTypes): Promise<ResponseMessage> {
        // ids of records to be deleted, from queryParams
        let docIds: Array<string> = [];          // reset docIds instance value
        await this.currentRecs.forEach((item: any) => {
            docIds.push(item._id);
        });
        this.docIds = docIds;
        return await this.taskPermission(taskType);
    }
}

export default Crud;
