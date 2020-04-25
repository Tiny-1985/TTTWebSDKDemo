
'use strict';

// 
let client = null;

let gStream = null;

let videoEle = document.getElementById('screen');

let tttStatus = 0;

// 
let rSeed = (Math.random() * 100000000);
let userId = Math.floor(rSeed) + 1;

let userRole = 2;

let xAppId = 'a967ac491e3acf92eed5e1b5ba641ab7'; // test900572e02867fab8131651339518

const sdkVersionEle = document.getElementById('sdkVersion');
if (!!sdkVersionEle)
{
	sdkVersionEle.innerHTML = `sdk version : ${window.RTCObj.version}`;
}

const roomIdEle = document.getElementById('chanid');
if (!!roomIdEle)
{
	rSeed = (Math.random() * 100000000);
	roomIdEle.value = Math.floor(rSeed) + 1;
}

// 登录按钮点击事件处理
let joinChanEle = document.getElementById('joinChan');
if (!!joinChanEle)
{
	joinChanEle.addEventListener('click', () =>
	{
		const rid = roomIdEle.value;
		joinChan(xAppId, rid, userId);
	})
}

function joinChan(appid, chanid, userid)
{
	// 
	if (tttStatus === 1)
	{
		console.log('已在房间内，无需重复登录');

		return;
	}

	client = window.RTCObj.createClient({
		role: userRole
	});

	client.init(appid, userid, () =>
	{
		client.join('', chanid, () =>
		{
			console.log(`<demo> 成功加入房间!! userid: ${userid}`);

			document.getElementById('loginStatus').innerHTML = `<font color="green">登录成功</font>`;
			document.getElementById('loginInfo').innerHTML = `-- channelId: ${chanid} - userId: ${userid} - role: ${userRole}<br>`;

			tttStatus = 1; // 状态标注为: 登录成功
		}, (err) =>
		{
			tttStatus = 0;

			console.log(`<demo> login failed. - error: ${JSON.stringify(err)}`);

			document.getElementById('loginStatus').innerHTML = '<font color="red">登录失败</font>';
			document.getElementById('loginInfo').innerHTML = '';
		});
	}, (err) =>
	{
		console.log(`<demo> init failed. - error: ${JSON.stringify(err)}`);

		return;
	});

	// 
	client.on('screen-published', (evt) =>
	{
		console.log(`<demo> - event [screen-published] uid: ${evt.streamId}`);
		document.getElementById('publishScreenStatus').innerHTML = `<font color="green">已推流</font>`;
	});

	client.on('screen-unpublished', (evt) =>
	{
		console.log(`<demo> - event [screen-unpublished] uid: ${evt.streamId}`);
		document.getElementById('publishScreenStatus').innerHTML = `<font color="black">未推流</font>`;
	});
}

// 退出按钮点击事件处理
let leaveChanEle = document.getElementById('leaveChan');
if (!!leaveChanEle)
{
	leaveChanEle.addEventListener('click', () =>
	{
		leaveChan();
	})
}

function leaveChan()
{
	if (tttStatus !== 1)
	{
		console.log('<demo> leaveChan while tttStatus is not 1?');
		return;
	}

	tttStatus = 0;

	if (client)
	{
		client.leave(() => { }, () => { });
		client.close();
	}

	// 
	document.getElementById('loginStatus').innerHTML = '<font color="red">未登录</font>';
	document.getElementById('loginInfo').innerHTML = '';

	console.log('<demo> leaveChan OK');
}

/******************* for Screen Stream */
//
// 
let publishScreenEle = document.getElementById('publishScreen');
if (!!publishScreenEle)
{
	publishScreenEle.addEventListener('click', () =>
	{
		publishStream();
	})
}

let unpublishScreenEle = document.getElementById('unpublishScreen');
if (!!unpublishScreenEle)
{
	unpublishScreenEle.addEventListener('click', () =>
	{
		unpublishStream({});
	})
}

// 
function publishStream()
{
	// 
	if (tttStatus !== 1)
	{
		console.log('<demo> publishStream - 请先[加入房间]');
		return;
	}

	// 
	gStream = window.RTCObj.createStream({
		userId: +userId,
		audio: true,
		video: false,
		screen: true
	});

	if (!gStream)
		return;

	gStream.init(() =>
	{
		gStream.on('screen-close', (e) =>
		{
			console.log(`<demo> event [screen-close] - ${JSON.stringify(e)}`);
			unpublishStream({ trackClosed: true });
		});

		const videoId = '3t_local_screen';
		let videoE = document.createElement('video');
		videoE.id = videoId;
		videoE.muted = true;
		videoE.autoplay = true;
		videoE.controls = true;
		videoE.setAttribute('playsinline', '');
		videoE.style.cssText = 'height: 300px; width: 300px; background: black; position: relative; display: inline-block;'

		if (!!videoEle)
		{
			videoEle.append(videoE);
		}

		gStream.play(videoId);

		client.publish(gStream, () => {}, () => {
			// 
			gStream.close();
			gStream = null;
		});
		// 
	}, (evt) =>
	{
		console.log('<demo> publishStream - Stream.init failed. - error: ' + evt);
		
		// 
		gStream.close();
		gStream = null;
	});
}

// 
function unpublishStream(opts)
{
	const { trackClosed } = opts;

	client.unpublish(gStream, () =>
	{
		console.log(`<demo> unpublishStream - client.unpublish local stream ${gStream.getId()} success.`);
	}, () =>
	{
		console.log('<demo> unpublishStream - client.unpublish local stream failed');
	}, false/*true*/);

	// 
	if (!!trackClosed)
	{
		gStream.close();

		const videoId = '3t_local_screen';
		let obj = document.getElementById(videoId);
		if (obj)
		{
			console.log('<demo> unpublishStream - obj.remove -- 3t_local_screen');
			obj.remove();
		}

		gStream = null;
	}
}
