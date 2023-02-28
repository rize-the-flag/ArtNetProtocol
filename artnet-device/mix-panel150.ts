import {ArtNetDmxPacket} from '../packets/art-dmx-packet'
import {Socket} from 'dgram'
import {IArtNetBridge, IArtNetLightEmitter} from "../types";
import {ARTNET_PORT} from "../constants";

const BRIGHTNESS_CHANNEL = 0
const FUNCTION = 1
const FUNCTION_CCT = 50
const FUNCTION_HSI = 100
const FUNCTION_RGBW = 150
const FUNCTION_GEL = 200
const FUNCTION_EFFECT = 250

const FUNCTION_DATA_CHANNEL = 2
const FUNCTION_DATA_SUB_CHANNEL_1 = 3
const FUNCTION_DATA_SUB_CHANNEL_2 = 4
const FUNCTION_DATA_SUB_CHANNEL_3 = 5
const FUNCTION_DATA_SUB_CHANNEL_4 = 6

const BRIGHTNESS_DMX_MAX = 200
const BRIGHTNESS_STEP = BRIGHTNESS_DMX_MAX / 100

const CCT_MAX = 7500
const CCT_MIN = 2700
const CCT_STEP = (CCT_MAX - CCT_MIN) / 255

const GM_DMX_MAX = 226
const GM_MAX = 50
const GM_MIN = -50
const GM_STEP = GM_DMX_MAX / 100;

const HARD_LIGHT = 0
const SOFT_LIGHT = 255

const SATURATION_MAX = 100
const SATURATION_DMX_MAX = 253

const HUE_MAX = 360
const HUE_DMX_MAX = 255

const LIGHTNING_MODE_CHANNEL = 11
const LIGHTNING_MODE_SILENT = 0
const LIGHTNING_MODE_NORMAL = 100
const LIGHTNING_MODE_BOOST = 200

export class MixPanel150 implements IArtNetLightEmitter {
    constructor(private _bridge: IArtNetBridge,
                private dmxData: ArtNetDmxPacket,
                private socket: Socket) {
        this.initDefaultState()
    }

    set bridge(bridge: IArtNetBridge) {
        this._bridge = bridge
    }

    get bridge() {
        return this._bridge
    }

    private initDefaultState() {
        this.setBrightness(30)
        this.setColorTemperature(5000)
        this.setGreenMagentaBias(0)
        this.setLightDiffusion('SOFT')
        this.setLightMode('SILENT')
        this.sendData()
    }

    sendData() {
        this.socket.send(this.dmxData.encode(), ARTNET_PORT, this.bridge.ipAddress);
    }

    checkInRange<T>(min: T, max: T, value: T): T {
        value = (value < max) ? value : max
        value = (value > min) ? value : min
        return value
    }

    setBrightness(percent: number): void {
        percent = this.checkInRange(0, 100, percent)
        const value = BRIGHTNESS_STEP * percent;
        this.dmxData.setChannel(BRIGHTNESS_CHANNEL, parseInt(value.toFixed()))
    }

    setColorTemperature(kelvins: number): void {
        kelvins = this.checkInRange(CCT_MIN, CCT_MAX, kelvins);
        const value = (kelvins - CCT_MIN) / CCT_STEP;
        this.dmxData
            .setChannel(FUNCTION, FUNCTION_CCT)
            .setChannel(FUNCTION_DATA_CHANNEL, value)
    }

    setGreenMagentaBias(bias: number): void {
        bias = this.checkInRange(GM_MIN, GM_MAX, bias);
        const value = Math.ceil(parseFloat(((GM_MAX + bias) * GM_STEP).toFixed(1)));
        this.dmxData
            .setChannel(FUNCTION, FUNCTION_CCT)
            .setChannel(FUNCTION_DATA_SUB_CHANNEL_1, value)
    }

    setHUE(degrees: number): void {
        degrees = this.checkInRange(0, HUE_MAX, degrees);
        const value = Math.ceil(HUE_MAX / HUE_DMX_MAX * degrees);
        this.dmxData
            .setChannel(FUNCTION, FUNCTION_HSI)
            .setChannel(FUNCTION_DATA_CHANNEL, value)
    }

    setLightDiffusion(mode: 'HARD' | 'SOFT'): void {
        this.dmxData
            .setChannel(FUNCTION, FUNCTION_CCT)
            .setChannel(FUNCTION_DATA_SUB_CHANNEL_2, mode === 'HARD' ? HARD_LIGHT : SOFT_LIGHT)
    }

    setSaturation(percent: number): void {
        percent = this.checkInRange(0, SATURATION_MAX, percent);
        const value = Math.ceil(percent * SATURATION_DMX_MAX / SATURATION_MAX)
        this.dmxData
            .setChannel(FUNCTION, FUNCTION_HSI)
            .setChannel(FUNCTION_DATA_SUB_CHANNEL_1, value)
    }

    setLightMode(mode: 'SILENT' | 'BOOST' | 'NORMAL') {
        let value = LIGHTNING_MODE_NORMAL
        switch (mode) {
            case "BOOST":
                value = LIGHTNING_MODE_BOOST
                break
            case "NORMAL":
                value = LIGHTNING_MODE_NORMAL
                break
            case "SILENT":
                value = LIGHTNING_MODE_SILENT
                break
        }
        this.dmxData
            .setChannel(LIGHTNING_MODE_CHANNEL, value)
    }

    runCCTLoop(fromCCT: number = 2700, toCCT: number = 7500, speed: number = 255, direction: 'ONE_WAY' | 'BACK_AND_FORCE' = 'BACK_AND_FORCE') {
        fromCCT = this.checkInRange(CCT_MIN, CCT_MAX, fromCCT);
        toCCT = this.checkInRange(CCT_MIN, CCT_MAX, toCCT);
        const valueFromCCT = (fromCCT - CCT_MIN) / CCT_STEP;
        const valueToCCT = (toCCT - CCT_MIN) / CCT_STEP;
        this.dmxData
            .setChannel(FUNCTION, FUNCTION_EFFECT)
            .setChannel(FUNCTION_DATA_CHANNEL, 20)
            .setChannel(FUNCTION_DATA_SUB_CHANNEL_1, valueFromCCT)
            .setChannel(FUNCTION_DATA_SUB_CHANNEL_2, valueToCCT)
            .setChannel(FUNCTION_DATA_SUB_CHANNEL_3, speed)
            .setChannel(FUNCTION_DATA_SUB_CHANNEL_4, direction === 'ONE_WAY' ? 0 : 255)
    }
}