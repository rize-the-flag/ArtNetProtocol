import {ArtNetPacket} from "./art-net-packet";
import {OP_CODE, PROTOCOL_VERSION} from "../constants";
import {ArtNetDmxPacketPayload, ArtnetDmxPacketScheme} from '../types'
import {PacketBuilder} from './packet-builder'

export class ArtNetDmxPacket extends ArtNetPacket<Partial<ArtNetDmxPacketPayload>> {

    static DMX_CHANNEL_MAX = 512;
    static DMX_VALUE_MAX = 255;
    private dmxChannelData: number[] = [];

    private artNetDmxScheme: ArtnetDmxPacketScheme = {
        protoVersion: {length: 2, type: 'number', byteOrder: 'BE'},
        sequence: {length: 1, type: 'number'},
        physical: {length: 1, type: 'number'},
        subUniverse: {length: 1, type: 'number'},
        net: {length: 1, type: 'number'},
        length: {length: 2, type: 'number', byteOrder: 'BE'},
        dmxData: {length: ArtNetDmxPacket.DMX_CHANNEL_MAX, type: 'array'}
    }

    constructor(packetPayload: Partial<ArtNetDmxPacketPayload> = {}) {
        super(OP_CODE.OP_DMX, packetPayload);
        this.packetPayload.protoVersion = PROTOCOL_VERSION;
        this.packetPayload.net = packetPayload?.net || 0;
        this.packetPayload.length = packetPayload?.length || 512;
        this.packetPayload.subUniverse = packetPayload?.subUniverse || 0;
        this.packetPayload.sequence = packetPayload?.sequence || 0;
        this.packetPayload.physical = packetPayload?.physical || 0;
    }

    protected build(): Buffer {
        this.packetPayload.dmxData = this.dmxChannelData;
        return PacketBuilder.encode(this.packetPayload, this.artNetDmxScheme);
    }

    setChannel(channel: number, value: number) {
        channel = channel < ArtNetDmxPacket.DMX_CHANNEL_MAX
            ? channel
            : ArtNetDmxPacket.DMX_CHANNEL_MAX;
        value = value < ArtNetDmxPacket.DMX_VALUE_MAX
            ? value
            : ArtNetDmxPacket.DMX_VALUE_MAX;

        this.dmxChannelData[channel] = value;
        return this;
    }

}