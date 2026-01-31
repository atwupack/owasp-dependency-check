import { describe, it } from "node:test";
import { Maybe } from "purify-ts";
import assert from "node:assert/strict";
import { fetchJson, fetchUrl, parseUrl } from "./net.js";
import sinon from "sinon";
import undici, { Response } from "undici";

void describe("util/net.ts", () => {
  void describe("parseUrl", () => {
    void it("should return Nothing if the url is not valid", () => {
      const url = parseUrl("htt\\p://user:password@server:8080");
      assert.equal(url, Maybe.empty());
    });
    void it("should return an URL if the url is valid", () => {
      const url = parseUrl("http://user:password@server:8080");
      assert.notEqual(url, Maybe.empty());
      url.ifJust(url => {
        assert.equal(url.protocol, "http:");
        assert.equal(url.hostname, "server");
        assert.equal(url.port, "8080");
        assert.equal(url.username, "user");
        assert.equal(url.password, "password");
      });
    });
  });
  void describe("fetchUrl", () => {
    void it("should return MaybeAsync with response when fetch is successful", async () => {
      const undiciMock = sinon.mock(undici);
      const response = { ok: true } as Response;
      undiciMock.expects("fetch").once().resolves(response);
      const url = "https://example.com";
      const init = {};
      const result = await fetchUrl(url, init).run();
      assert.ok(result.isRight());
      undiciMock.verify();
    });

    void it("should return MaybeAsync with Nothing when fetch response is not ok", async () => {
      const undiciMock = sinon.mock(undici);
      const response = { ok: false } as Response;
      undiciMock.expects("fetch").once().resolves(response);
      const url = "https://example.com";
      const init = {};
      const result = await fetchUrl(url, init).run();
      assert.ok(result.isLeft());
      undiciMock.verify();
    });

    void it("should return MaybeAsync with Nothing when rejects with an error", async () => {
      const undiciMock = sinon.mock(undici);
      undiciMock.expects("fetch").once().rejects(Error("Network error"));
      const url = "https://example.com";
      const init = {};
      const result = await fetchUrl(url, init).run();
      assert.ok(result.isLeft());
      undiciMock.verify();
    });
    void it("should return MaybeAsync with Nothing when rejects throws an error", async () => {
      const undiciMock = sinon.mock(undici);
      undiciMock.expects("fetch").once().throws(Error("Network error"));
      const url = "https://example.com";
      const init = {};
      const result = await fetchUrl(url, init).run();
      assert.ok(result.isLeft());
      undiciMock.verify();
    });
  });

  void describe("fetchJson", () => {
    void it("should return MaybeAsync with parsed JSON when fetch is successful and response is ok", async () => {
      const undiciMock = sinon.mock(undici);
      const jsonData = { foo: "bar" };
      const response = {
        ok: true,
        json: sinon.stub().resolves(jsonData),
      } as unknown as Response;
      undiciMock.expects("fetch").once().resolves(response);
      const url = "https://example.com";
      const init = {};
      const result = await fetchJson(url, init).run();
      assert.ok(result.isRight());
      assert.deepEqual(result.extract(), jsonData);
      undiciMock.verify();
    });

    void it("should return MaybeAsync with Nothing when fetch response is not ok", async () => {
      const undiciMock = sinon.mock(undici);
      const response = { ok: false, json: sinon.stub() } as unknown as Response;
      undiciMock.expects("fetch").once().resolves(response);
      const url = "https://example.com";
      const init = {};
      const result = await fetchJson(url, init).run();
      assert.ok(result.isLeft());
      undiciMock.verify();
    });

    void it("should return MaybeAsync with Nothing when fetch reject with an error", async () => {
      const undiciMock = sinon.mock(undici);
      undiciMock.expects("fetch").once().rejects(Error("Network error"));
      const url = "https://example.com";
      const init = {};
      const result = await fetchJson(url, init).run();
      assert.ok(result.isLeft());
      undiciMock.verify();
    });
  });
});
