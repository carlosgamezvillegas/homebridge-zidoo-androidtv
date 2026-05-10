"use strict";

const assert = require("assert");
const plugin = require("../index.js");

const accessoryProto = plugin.zidooAccessory.prototype;

function runTest(name, testFn) {
    try {
        testFn();
        process.stdout.write(`ok - ${name}\n`);
    }
    catch (error) {
        process.stderr.write(`not ok - ${name}\n${error.stack}\n`);
        process.exitCode = 1;
    }
}

runTest("pressedButton rejects removed FORWAD typo alias", () => {
    const errors = [];
    const context = {
        ZIDOO_IP: "192.168.1.10",
        ZIDOO_PORT: 9529,
        config: { standby: false },
        logError: (message) => errors.push(message),
    };
    const legacyUrl = accessoryProto.pressedButton.call(context, "FORWAD");
    const canonicalUrl = accessoryProto.pressedButton.call(context, "FORWARD");
    assert.strictEqual(legacyUrl, null);
    assert.ok(canonicalUrl.includes("MediaForward"));
    assert.strictEqual(errors.length, 1);
    assert.ok(String(errors[0]).includes("Unknown button command"));
});

runTest("query fails closed on unknown names", () => {
    const errors = [];
    const context = {
        ZIDOO_IP: "192.168.1.10",
        ZIDOO_PORT: 9529,
        logError: (message) => errors.push(message),
    };
    const unknown = accessoryProto.query.call(context, "UNKNOWN QUERY");
    assert.strictEqual(unknown, null);
    assert.strictEqual(errors.length, 1);
    assert.ok(String(errors[0]).includes("Unknown query name"));
});

runTest("toFiniteNumber normalizes invalid values", () => {
    const context = {};
    assert.strictEqual(accessoryProto.toFiniteNumber.call(context, "42", 0), 42);
    assert.strictEqual(accessoryProto.toFiniteNumber.call(context, "abc", 7), 7);
});

runTest("isOfflineTransportError recognizes socket hang up", () => {
    const context = {};
    assert.strictEqual(
        accessoryProto.isOfflineTransportError.call(context, { message: "socket hang up" }),
        true,
    );
    assert.strictEqual(
        accessoryProto.isOfflineTransportError.call(context, { message: "unexpected parse issue" }),
        false,
    );
});

runTest("handleVideoStatusPayload tolerates missing video payload", () => {
    const context = {
        turnOffCommand: false,
        standbyMode: 0,
        newPowerState: () => { },
        logDebug: () => { },
    };
    accessoryProto.handleVideoStatusPayload.call(context, {});
});

runTest("handleMusicStatusPayload accepts currentVolume fallback key", () => {
    let observedVolume = null;
    const context = {
        moviePlaying: false,
        turnOffCommand: false,
        standbyMode: 0,
        showState: false,
        musicPlaying: false,
        newPowerState: () => { },
        newVolumeStatus: (value) => { observedVolume = value; },
        newPlayBackState: () => { },
        mediaDetailsReset: () => { },
        newMovieTime: () => { },
        newSubtitle: () => { },
        newVideoFormat: () => { },
        newAudioFormat: () => { },
        newLanguage: () => { },
        newInputName: () => { },
        newInputDuration: () => { },
        nameLengthCheck: (name) => name,
        normalizeRuntimeFromMs: () => "00:00:01",
        toFiniteNumber: accessoryProto.toFiniteNumber,
        logDebug: () => { },
    };
    accessoryProto.handleMusicStatusPayload.call(context, {
        state: 0,
        duration: 0,
        position: 0,
        playingMusic: {},
        volumeData: {
            maxVolume: 20,
            currentVolume: 10,
            isMute: false,
        },
    });
    assert.strictEqual(observedVolume, 50);
});

runTest("routeHttpEvent dispatches to getPlayStatus handler", () => {
    let invoked = false;
    const context = {
        handleVideoStatusPayload: () => { invoked = true; },
        handleMusicStatusPayload: () => { },
        applyVolumePayload: () => { },
        newPlayBackState: () => { },
        mediaDetailsReset: () => { },
        turnOffAll: () => { },
        newPowerState: () => { },
        standbyMode: 0,
        turnOffCommand: false,
    };
    accessoryProto.routeHttpEvent.call(context, {}, "getPlayStatus");
    assert.strictEqual(invoked, true);
});
