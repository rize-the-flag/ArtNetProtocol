import {
    ArtNetPacketPayload,
    IArtNetPacketSchemeRecord,
} from '../types'
import {ARTNET_PACKET_ID} from '../constants'

export class PacketBuilder {
    static decode<T extends ArtNetPacketPayload, U extends Record<keyof T, IArtNetPacketSchemeRecord>>
    (buffer: Buffer, scheme: U, headerOffset: number): T {

        const packetPayload = {} as ArtNetPacketPayload

        const payloadByteLength = Object.values(scheme)
            .reduce((previousValue, currentValue) => previousValue + currentValue.length, 0)

        if (payloadByteLength + headerOffset > buffer.length) throw new Error(`packet size mismatch`)

        for (const [key, value] of Object.entries(scheme)) {
            if (value.type === 'number') {
                if (value.length > 1) {
                    value.byteOrder === 'LE'
                        ? packetPayload[key] = buffer.readUint16LE(headerOffset)
                        : packetPayload[key] = buffer.readUInt16BE(headerOffset)
                } else {
                    packetPayload[key] = buffer.readUint8(headerOffset)
                }
            } else if (value.type === 'string') {
                const nullTerminated = buffer.subarray(headerOffset, headerOffset + value.length).toString()
                const lastIndex = nullTerminated.indexOf('\x00')
                packetPayload[key] = nullTerminated.substring(0, lastIndex !== -1 ? lastIndex : nullTerminated.length)
            } else {
                packetPayload[key] = Array.from(buffer.subarray(headerOffset, headerOffset + value.length))
            }
            headerOffset += value.length
        }
        return packetPayload as T
    }

    static encode<T extends ArtNetPacketPayload, U extends Record<keyof T, IArtNetPacketSchemeRecord>>
    (payload: T, scheme: U): Buffer {

        const packetByteLength = Object.values(scheme)
            .reduce((previousValue, currentValue) => previousValue + currentValue.length, 0)

        let packet: Buffer = Buffer.alloc(packetByteLength)
        let offset = 0
        for (const [key, value] of Object.entries(scheme)) {
            if (!(key in payload)) throw new Error(`Scheme key:[ ${key} ] doesn't exist in packet`)

            if (typeof payload[key] === 'number' && value.type === 'number') {
                if (value.length > 1) {
                    value.byteOrder === 'LE'
                        ? packet.writeUInt16LE(payload[key] as number, offset)
                        : packet.writeUInt16BE(payload[key] as number, offset)
                } else {
                    packet.writeUInt8(payload[key] as number, offset)
                }
                offset += value.length
            } else if (value.type === 'string' && typeof payload[key] === 'string') {
                const bytes = (payload[key] as string).split('')
                bytes.forEach((byte: string) => {
                    packet.writeUInt8(byte.charCodeAt(0), offset)
                    offset++
                })
                offset += value.length - bytes.length
            } else {
                for (const byte of payload[key] as number[]) {
                    packet.writeUInt8(byte, offset)
                    offset++
                }
            }
        }
        return packet
    }

    static getPacketID(buffer: Buffer) {
        return buffer.subarray(0, ARTNET_PACKET_ID.length).toString()
    }

    static getPacketOpCode(buffer: Buffer) {
        return buffer.readUInt16LE(ARTNET_PACKET_ID.length + 1)
    }
}