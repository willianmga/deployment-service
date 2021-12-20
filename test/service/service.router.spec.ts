import {describe} from "mocha";
import {expect} from "chai";
import request from "supertest";
import {ExpressServer} from "../../src/express";
import {InMemoryMongoConnection} from "../inmemory.mongo";
import * as http from "http";
import {logger} from "../../src/logger";

describe("Api tests", () => {

    let inMemoryMongoConnection: InMemoryMongoConnection;
    let expressApp: http.Server;

    before(async () => {
        inMemoryMongoConnection = new InMemoryMongoConnection();
        await inMemoryMongoConnection.connect();
        expressApp = await ExpressServer.start();
    });

    after((done) => {
        inMemoryMongoConnection.stop()
            .then(() => {
                expressApp.close(() => {
                    logger.info("closed");
                    done();
                });
            });
    })

    afterEach(async () =>{
        await inMemoryMongoConnection.cleanUp();
    })

    it("should return empty services", async () => {
        return request(expressApp)
            .get("/service")
            .expect('Content-type', /json/)
            .expect(200);
    });

});
