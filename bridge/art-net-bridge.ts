import {IArtNetBridge} from "../types";

export class ArtNetBridge implements IArtNetBridge {
    constructor(
        private _bridgeName: string,
        private _ipAddress: string,
        private _macAddress: string,
        private _lastPollingTime: Date,
    ) {}

    get bridgeName() {
        return this._bridgeName
    }

    get ipAddress() {
        return this._ipAddress
    }

    set ipAddress(newIpAddress: string) {
        this._ipAddress = newIpAddress
    }

    get macAddress() {
        return this._macAddress;
    }

    set macAddress(macAddress: string) {
        this._macAddress = macAddress;
    }

    get lastPollingTime() {
        return this._lastPollingTime
    }

    set lastPollingTime(date: Date) {
        this._lastPollingTime = date
    }
}