/**
 * @Author: abbeymart | Abi Akindele | @Created: 2020-08-05
 * @Company: Copyright 2020 Abi Akindele  | mConnect.biz
 * @License: All Rights Reserved | LICENSE.md
 * @Description: mc-central-ts: simple mongodb model class for relations/ref-integrity
 */

import { ModelOptionsType, ModelRelationType, } from "./modelTypes";

export class Model {
    private readonly collName: string;
    private readonly relations: Array<ModelRelationType>;
    protected modelOptions: ModelOptionsType;

    constructor(coll: string, relations: Array<ModelRelationType>, options: ModelOptionsType = {}) {
        this.collName = coll;
        this.relations = relations;
        this.modelOptions = options ? options : {
            timeStamp  : true,
            actorStamp : true,
            activeStamp: true,
        };
    }

    // ***** instance methods: getters | setters *****
    get modelCollName(): string {
        return this.collName;
    }

    get modelRelations(): Array<ModelRelationType> {
        return this.relations;
    }

    get modelOptionValues(): ModelOptionsType {
        return this.modelOptions;
    }

    // instance methods
    getParentRelations(): Array<ModelRelationType> {
        // extract relations/collections where targetColl === this.collName
        // sourceColl is the parentColl of this.collName(target/child)
        let parentRelations: Array<ModelRelationType> = [];
        try {
            const modelRelations = this.modelRelations;
            for (const item of modelRelations) {
                if (item.targetColl === this.modelCollName) {
                    parentRelations.push(item);
                }
            }
            return parentRelations;
        } catch (e) {
            // throw new Error(e.message);
            return parentRelations;
        }
    }

    getChildRelations(): Array<ModelRelationType> {
        // extract relations/collections where sourceColl === this.collName
        // targetColl is the childColl of this.collName(source/parent)
        let childRelations: Array<ModelRelationType> = [];
        try {
            const modelRelations = this.modelRelations;
            for (const item of modelRelations) {
                if (item.sourceColl === this.modelCollName) {
                    childRelations.push(item);
                }
            }
            return childRelations;
        } catch (e) {
            // throw new Error(e.message);
            return childRelations;
        }
    }

    getParentColls(): Array<string> {
        let parentColls: Array<string>;
        const parentRelations = this.getParentRelations();
        parentColls = parentRelations.map(rel => rel.sourceColl);
        return parentColls;
    }

    getChildColls(): Array<string> {
        let childColls: Array<string>;
        const childRelations = this.getChildRelations();
        childColls = childRelations.map(rel => rel.targetColl);
        return childColls;
    }
}

// factory function
export function newModel(coll: string, relations: Array<ModelRelationType>, options: ModelOptionsType = {}) {
    return new Model(coll, relations, options);
}
