/** @type {HTMLCanvasElement} */
const rainCanvas = document.getElementById("rainCanvas");
/** @type {CanvasRenderingContext2D} */
const ctx = rainCanvas.getContext("2d");

let urlParams = new URLSearchParams(window.location.search);
let cookies = document.cookie.split("; ");

if (!checkCookie("lightning")) setCookie("lightning", false); // default to false
let lightningActive = getCookie("lightning") == "true";
document.getElementById("lightning-toggle").checked = lightningActive;

if (!checkCookie("rain")) setCookie("rain", true); // default to true
let rainActive = getCookie("rain") == "true";
document.getElementById("rain-toggle").checked = rainActive;

let framerate = 24; // frames per second
let rainWidth = 1;  // width of each raindrop in pixels
let rainLength = 50; // base length of each raindrop in pixels
let rainSpeed = 420; // base pixels per second
let rainSpeedVariation = 30; // base pps offset range for each raindrop
let rainAngle = 30; // angle of rainfall in degrees
let rainAngleVariation = 2; // degree offset range for each raindrop
let rainAmount = 20; // approximate raindrops per square inch
let rainDistanceMax = 100; // the maximum distance raindrops can be from the screen
let rainDistanceSlices = 10; // the amount of distance planes rain should be generated in, for making more raindrops farther away

function flashLightning() {
	if (lightningActive)
		document.body.classList.add("lightning-flash");
	setTimeout(unflashLightning, 1);
}

function unflashLightning() {
	document.body.classList.remove("lightning-flash");
	window.setTimeout(flashLightning, getRandomNumber(5000, 20000));
}

window.setTimeout(flashLightning, getRandomNumber(5000, 20000));

function toggleLightning(isActive) {
	lightningActive = isActive;
	setCookie("lightning", isActive);
}

function toggleRain(isActive) {
	rainActive = isActive;
	setCookie("rain", isActive);
}

let raindrops = [];

function onResize() {
	let w = rainCanvas.width = window.innerWidth;
	let h = rainCanvas.height = window.innerHeight;

	raindrops = [];

	let distances = [];
	let totalVolume = 0;
	for (let i = 0; i < rainDistanceSlices + 1; i++) {
		distances[i] = rainDistanceMax / rainDistanceSlices * i;
		totalVolume += i ** 2;
	}

	let pixelCount = w * h;
	let screenArea = pixelCount / (96 ** 2);
	let totalRaindrops = rainAmount * screenArea;

	for (let j = 0; j < rainDistanceSlices; j++) {
		let d = distances[j];
		for (let i = 0; i < (j ** 2) / totalVolume * totalRaindrops; i++) {
			raindrops.push({
				x: getRandomNumber(-rainLength, w + rainLength),
				y: getRandomNumber(-rainLength, h + rainLength),
				speedOffset: getRandomNumber(-rainSpeedVariation, rainSpeedVariation),
				angleOffset: getRandomNumber(-rainAngleVariation, rainAngleVariation),
				distance: getRandomNumber(d, distances[j + 1]),
			})
		}
	}
}

window.addEventListener("resize", onResize);
onResize();

function updateRain() {
	ctx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);

	if (!rainActive) return;

	ctx.lineWidth = rainWidth;

	for (const drop of raindrops) {
		const distanceCoeff = 25 / drop.distance; // should this magic number be something more significant maybe?
		const angle = rainAngle + drop.angleOffset;
		const speed = (rainSpeed + rainSpeedVariation) * distanceCoeff;
		const length = (rainLength) * distanceCoeff;

		const rads = angle * (Math.PI / 180);
		const rainStepX = Math.sin(rads);
		const rainStepY = Math.cos(rads);

		drop.x += rainStepX * speed / framerate;
		drop.y += rainStepY * speed / framerate;

		if (drop.x > rainCanvas.width + rainLength)
			drop.x = -rainLength;
		if (drop.y > rainCanvas.height + rainLength)
			drop.y = -rainLength;
		if (drop.x < -rainLength)
			drop.x = rainCanvas.width + rainLength;
		if (drop.y < -rainLength)
			drop.y = rainCanvas.height + rainLength;

		ctx.strokeStyle = `rgba(255, 255, 255, ${distanceCoeff})`;
		ctx.beginPath();
		ctx.moveTo(drop.x, drop.y);
		ctx.lineTo(drop.x + rainStepX * length, drop.y + rainStepY * length);
		ctx.stroke();
	}
}

window.setInterval(updateRain, 1000 / framerate);