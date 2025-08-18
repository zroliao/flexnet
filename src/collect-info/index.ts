
import * as net from 'net';
import * as  http from 'http';
import * as  https from 'https';
import {GeoIP} from '../context';

async function timeout(msec: number): Promise<null> {
	return new Promise<null>((done) => {
		setTimeout(() => {
			done(null);
		}, msec);
	});
}

async function getPublicIpAddressFn(url: string): Promise<string | null> {
	return new Promise<string | null>((done) => {
		https.get(url, (response) => {

			// * handle HTTP response
			// * ======================================
			response.setEncoding('utf8')
			response.on('data', (data) => {
				done(net.isIPv4(data) ? data : null);
			})

			// * handle HTTP error
			// * ======================================
			response.on('error', () => {
				done(null);
			})

		}).on('error', () => {
			done(null);
		})
	});
}

async function getPublicIpAddress1(): Promise<string | null> {
	return await Promise.race([
		getPublicIpAddressFn('https://api.ipify.org'), timeout(3000)
	]);
}

async function getPublicIpAddress2(): Promise<string | null> {
	return await Promise.race([
		getPublicIpAddressFn('https://ip4.seeip.org'), timeout(3000)
	]);
}

async function getPublicIpAddress3(): Promise<string | null> {
	return await Promise.race([
		getPublicIpAddressFn('https://ipinfo.io/ip'), timeout(3000)
	]);
}

async function getPublicIpAddress4(): Promise<string | null> {
	return await Promise.race([
		getPublicIpFromIp4Me(), timeout(3000)
	]);
}

async function getPublicIpFromIp4Me(): Promise<string | null> {
	return new Promise<string | null>((done) => {
		http.get('http://ip4only.me/api/', (response) => {

			// * handle HTTP response
			// * ======================================
			response.setEncoding('utf8')
			response.on('data', (data) => {
				const arr: string[] = data?.split(',') || [];
				done(net.isIPv4(arr?.[1]) ? arr[1] : null);
			})

			// * handle HTTP error
			// * ======================================
			response.on('error', () => {
				done(null);
			})

		}).on('error', () => {
			done(null);
		})
	});
}

async function collectFromSource1(): Promise<GeoIP | null> {
	return new Promise<GeoIP | null>((done) => {
		https.get('https://api.ip.sb/geoip', (response) => {

			// * handle HTTP response
			// * ======================================
			response.setEncoding('utf8')
			response.on('data', (data) => {
				const json: {
					latitude: number;
					longitude: number;
					city: string;
					timezone: string;
					country: string;
					ip: string;
				} = JSON.parse(data);

				if (!json.ip) {
					done(null);
					return;
				}

				done({
					wanIp: json.ip || '',
					country: json.country || '',
					city: json.city || '',
					timezone: json.timezone || '',
					latitude: json.latitude || null,
					longitude: json.longitude || null
				});
			})

			// * handle HTTP error
			// * ======================================
			response.on('error', () => {
				done(null);
			})

		}).on('error', () => {
			done(null);
		})
	});
}

async function collectFromSource2(): Promise<GeoIP | null> {
	return new Promise<GeoIP | null>((done) => {
		https.get('https://ipwho.is/', (response) => {

			// * handle HTTP response
			// * ======================================
			response.setEncoding('utf8')
			response.on('data', (data) => {
				const json: {
					success: boolean;
					latitude: number;
					longitude: number;
					city: string;
					timezone: {
						id: string;
					};
					country: string;
					ip: string;
				} = JSON.parse(data);

				if (!json.ip) {
					done(null);
					return;
				}

				done({
					wanIp: json.ip || '',
					country: json.country || '',
					city: json.city || '',
					timezone: json?.timezone?.id || '',
					latitude: json.latitude || null,
					longitude: json.longitude || null
				});
			})

			// * handle HTTP error
			// * ======================================
			response.on('error', () => {
				done(null);
			})

		}).on('error', () => {
			done(null);
		})
	});
}

async function collectFromSource3(): Promise<GeoIP | null> {
	return new Promise<GeoIP | null>((done) => {
		http.get('http://ip-api.com/json', (response) => {

			// * handle HTTP response
			// * ======================================
			response.setEncoding('utf8')
			response.on('data', (data) => {
				const json: {
					status: boolean;
					lat: number;
					lon: number;
					city: string;
					timezone: string;
					country: string;
					query: string;
				} = JSON.parse(data);

				if (!json.query) {
					done(null);
					return;
				}

				done({
					wanIp: json.query || '',
					country: json.country || '',
					city: json.city || '',
					timezone: json.timezone || '',
					latitude: json.lat || null,
					longitude: json.lon || null
				});
			})

			// * handle HTTP error
			// * ======================================
			response.on('error', () => {
				done(null);
			})

		}).on('error', () => {
			done(null);
		})
	});
}

export async function getPublicIpAddress(): Promise<string | null> {
	let ip: string | null = null;
	ip = await getPublicIpAddress1();
	if (ip !== null) return ip
	ip = await getPublicIpAddress2();
	if (ip !== null) return ip
	ip = await getPublicIpAddress3();
	if (ip !== null) return ip
	ip = await getPublicIpAddress4();
	return ip;
}

export default async function (): Promise<GeoIP | null> {
	let retval: GeoIP | null = null;

	retval = await Promise.race([timeout(5000), collectFromSource1()]);
	if (retval !== null) return retval;

	retval = await Promise.race([timeout(5000), collectFromSource2()]);
	if (retval !== null) return retval;

	retval = await Promise.race([timeout(5000), collectFromSource3()]);
	return retval;
}