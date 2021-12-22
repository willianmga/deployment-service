import {describe} from "mocha";
import {expect} from "chai";
import request from "supertest";
import expressServer from "../../src/express";
import inMemoryMongoServer from "../inmemory.mongo.server";
import mongoConnection from "../../src/mongo";

describe("Api tests", () => {

    before(async () => {
        await inMemoryMongoServer.connect();
        await expressServer.start();
    });

    after(async () => {
        await mongoConnection.closeConnection();
        await inMemoryMongoServer.stop();
        await expressServer.stop();
    })

    afterEach(async () =>{
        //await inMemoryMongoConnection.cleanUp();
    })

    it("should return empty services", async () => {
        return request("http://localhost:8080")
            .get("/v1/services")
            .expect('Content-type', /json/)
            .expect(200);
    });

});
