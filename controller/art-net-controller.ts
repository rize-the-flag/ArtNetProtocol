import * as dgram from 'dgram'
import {getBroadcastAddressList} from '../network-utilities'
import {ArtNetPollPacket} from '../packets/art-poll-packet'
import {
    ARTNET_MESSAGE,
    ARTNET_PACKET_ID,
    ARTNET_PORT,
    DEFAULT_POLL_INTERVALL,
    DEVICE_DEATH_TIMEOUT_MS,
    OP_CODE
} from '../constants'
import {ArtPollReplyPacket} from '../packets/art-poll-reply-packet'
import EventEmitter from 'events'
import {Socket} from 'dgram'
import {
    ART_NET_DEVICE_TYPE,
    ArtnetDeviceFactory,
} from '../artnet-device/factory'
import {ArtNetDmxPacket} from '../packets/art-dmx-packet'
import {PacketBuilder} from '../packets/packet-builder'
import {ArtnetPollReplyPacketScheme, ArtNetPollReplyPacketPayload, IArtNetLightEmitter, IArtNetBridge} from '../types'
import {ArtNetBridge} from '../bridge/art-net-bridge'


//export namespace ArtNet {


export class ArtNetController extends EventEmitter {
    private socket: Socket
    private broadcastAddress = '255.255.255.255'
    private discoveryRef: ReturnType<typeof setInterval>
    private artNetDeviceList: IArtNetLightEmitter[] = []
    private bridgeList: IArtNetBridge [] = []

    constructor(ipAddress: string, netmask: string) {
        super()
        this.socket = dgram.createSocket('udp4')
        this.broadcastAddress = getBroadcastAddressList({ipAddress, netmask})
        this.socket.bind(ARTNET_PORT, () => {
            this.socket.setBroadcast(true)
        })
        this.socket.unref()
    }

    private listen() {
        this.socket.on('message', (data, remoteInfo) => {

            if (!this.isArtNetPacket(data)) return

            const opCode = PacketBuilder.getPacketOpCode(data)
            switch (opCode) {
                case OP_CODE.OP_POLL_REPLY:
                    console.log(`Received art poll reply packet from ${remoteInfo.address}:${remoteInfo.port}`)
                    this.onArtPollReply(data)
                    break
                case OP_CODE.OP_POLL:
                    console.log('Received art poll packet')
                    this.onArtPoll(remoteInfo.address)
                    break
            }
        })
    }

    private removeDeadBridges(timeToDeath: number = DEVICE_DEATH_TIMEOUT_MS) {
        const now = new Date().getTime();

        this.artNetDeviceList = this.artNetDeviceList.filter(
            device => now - device.bridge.lastPollingTime.getTime() < timeToDeath
        )

        this.bridgeList = this.bridgeList.filter(
            bridge => now - bridge.lastPollingTime.getTime() < timeToDeath
        )
    }

    startDiscovery(pollInterval: number = DEFAULT_POLL_INTERVALL) {
        const artPoll = new ArtNetPollPacket().encode()
        this.socket.send(artPoll, ARTNET_PORT, this.broadcastAddress)
        this.discoveryRef = setInterval(() => {
            this.socket.send(artPoll, ARTNET_PORT, this.broadcastAddress)
            this.removeDeadBridges()
        }, pollInterval)
        this.listen()
    }

    stopDiscovery() {
        if (!this.discoveryRef) return
        clearInterval(this.discoveryRef)
        this.socket.removeAllListeners('message')
    }

    isArtNetPacket(data?: Buffer) {
        if (!data) return false
        const ID = PacketBuilder.getPacketID(data)
        return ID === ARTNET_PACKET_ID
    }

    onArtPollReply(data: Buffer) {
        const artPollReplyPayload = PacketBuilder.decode<ArtNetPollReplyPacketPayload, ArtnetPollReplyPacketScheme>(
            data,
            ArtPollReplyPacket.artPollReplyPacketScheme,
            ArtPollReplyPacket.getHeaderLength())
        const {shortName: bridgeName, ipAddress: bridgeIp, macAddress} = artPollReplyPayload;

        this.emit(ARTNET_MESSAGE.POLL_REPLY, artPollReplyPayload)

        if (!bridgeName || !bridgeIp || !macAddress) return

        const bridge = this.bridgeList.find(bridge => bridge.bridgeName === bridgeName);
        if (!bridge) {
            this.bridgeList.push(new ArtNetBridge(bridgeName, bridgeIp.join('.'), macAddress.join('.'), new Date()));
        } else {
            bridge.ipAddress = bridgeIp.join('.')
            bridge.macAddress = macAddress.join('.')
            bridge.lastPollingTime = new Date()
        }
    }

    onArtPoll(ipAddress: string) {
        this.socket.send(new ArtPollReplyPacket({
            ipAddress: ipAddress.split('.').map(x => parseInt(x)),
            shortName: 'CONTROLLER',
        }).encode(), ARTNET_PORT, ipAddress)
        this.emit(ARTNET_MESSAGE.POLL)
    }

    getActiveBridges() {
        return this.bridgeList;
    }

    getConnectedDevices() {
        return this.artNetDeviceList;
    }

    subscribeDevice(deviceName: keyof ART_NET_DEVICE_TYPE, bridgeName: string) {
        const device = this.artNetDeviceList.find(device => device.bridge.bridgeName === bridgeName);
        const bridge = this.bridgeList.find(bridge => {
            return bridgeName === bridge.bridgeName
        })

        if(!bridge) return;

        if (device) {
            device.bridge = bridge;
            console.log(`Existing device attached to ${bridge.bridgeName}`)
        } else {
            this.artNetDeviceList.push(new (ArtnetDeviceFactory.createDevice(deviceName))(
                bridge,
                new ArtNetDmxPacket(),
                this.socket,
            ))
            console.log(`New device attached to ${bridge.bridgeName}`)
        }
    }

    setBrightness(bridgeName: string, percent: number) {
        console.log(`setBrightness ${bridgeName}: ${percent}`)
        const device = this.artNetDeviceList.find(device => device.bridge.bridgeName === bridgeName)
        if (!device) return

        if ('setBrightness' in device && typeof device['setBrightness'] === 'function') {
            device.setBrightness(percent)
            device.sendData()
        } else {
            console.log(`setBrightness function is unsupported for ${bridgeName}`);
        }
    }

    setColorTemperature(bridgeName: string, kelvins: number) {
        console.log(`setColorTemperature ${bridgeName}: ${kelvins}`)
        const device = this.artNetDeviceList.find(device => device.bridge.bridgeName === bridgeName)
        if (!device) return

        if ('setColorTemperature' in device && typeof device['setColorTemperature'] === 'function') {
            device.setColorTemperature(kelvins)
            device.sendData()
        } else {
            console.log(`setColorTemperature function is unsupported for ${bridgeName}`);
        }
    }

    setHUE(bridgeName: string, degrees: number) {
        console.log(`setGreenMagentaBias ${bridgeName}: ${degrees}`)
        const device = this.artNetDeviceList.find(device => device.bridge.bridgeName === bridgeName)
        if (!device) return
        if ('setHUE' in device && typeof device['setHUE'] === 'function') {
            device.setHUE(degrees)
            device.sendData()
        } else {
            console.log(`setHUE function is unsupported for ${bridgeName}`);
        }
    }

    setLightDiffusion(bridgeName: string, mode: 'HARD' | 'SOFT') {
        console.log(`setGreenMagentaBias ${bridgeName}: ${mode}`)
        const device = this.artNetDeviceList.find(device => device.bridge.bridgeName === bridgeName)
        if (!device) return
        if ('setLightDiffusion' in device && typeof device['setLightDiffusion'] === 'function') {
            device.setLightDiffusion(mode)
            device.sendData()
        } else {
            console.log(`setLightDiffusion function is unsupported for ${bridgeName}`);
        }
    }

    setLightMode(bridgeName: string, mode: 'SILENT' | 'BOOST' | 'NORMAL') {
        console.log(`setGreenMagentaBias ${bridgeName}: ${mode}`)
        const device = this.artNetDeviceList.find(device => device.bridge.bridgeName === bridgeName)
        if (!device) return
        if ('setLightMode' in device && typeof device['setLightMode'] === 'function') {
            device.setLightMode(mode)
            device.sendData()
        } else {
            console.log(`setLightMode function is unsupported for ${bridgeName}`);
        }
    }

    setGreenMagentaBias(bridgeName: string, bias: number) {
        console.log(`setGreenMagentaBias ${bridgeName}: ${bias}`)
        const device = this.artNetDeviceList.find(device => device.bridge.bridgeName === bridgeName)
        if (!device) return
        if ('setGreenMagentaBias' in device && typeof device['setGreenMagentaBias'] === 'function') {
            device.setGreenMagentaBias(bias)
            device.sendData()
        } else {
            console.log(`setGreenMagentaBias function is unsupported for ${bridgeName}`);
        }
    }

    setSaturation(bridgeName: string, percent: number) {
        console.log(`setGreenMagentaBias ${bridgeName}: ${percent}`)
        const device = this.artNetDeviceList.find(device => device.bridge.bridgeName === bridgeName)
        if (!device) return
        if ('setSaturation' in device && typeof device['setSaturation'] === 'function') {
            device['setSaturation'](percent)
            device.sendData()
        } else {
            console.log(`setSaturation function is unsupported for ${bridgeName}`);
        }
    }

    runCCTLoop(bridgeName: string) {
        console.log(`runCCTLoop`)
        const device = this.artNetDeviceList.find(device => device.bridge.bridgeName === bridgeName)
        if (!device) return
        if ('runCCTLoop' in device && typeof device['runCCTLoop'] === 'function') {
            device.runCCTLoop()
            device.sendData()
        } else {
            console.log(`runCCTLoop function is unsupported for ${bridgeName}`);
        }
    }
}

//}
