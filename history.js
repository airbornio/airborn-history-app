var currentPath, openingPath;

function open(path) {
	openingPath = path;
	var files = document.getElementById('files');
	airborn.fs.getFile(path, {codec: 'dir'}, function(contents) {
		if(path != openingPath) return; // We get called from this file and from openFileRequest, honor the last one.
		currentPath = path;
		airborn.wm.setTitle(path ? path.replace('/Documents/', '/').replace('.history/', ' \u2192 history') + ' - File History' : 'File History');
		var isHistory = path.indexOf('.history/') !== -1;
		document.getElementById('up').style.display = path === '/Documents/' ? 'none' : '';
		files.innerHTML = '';
		var lines = [];
		Object.keys(contents || {}).forEach(function(key) { lines.push([key, contents[key]]); });
		lines.filter(function(line) { return line[0].substr(-1) === '/' && line[0].substr(-9) !== '.history/'; }).alphanumSort().forEach(addLine);
		lines.filter(function(line) { return line[0].substr(-1) !== '/' || line[0].substr(-9) === '.history/'; }).alphanumSort().forEach(addLine);
		function addLine(line) {
			if(line[0] === '.history/') {
				return;
			}
			var file = document.createElement('div');
			file.className = 'file' + (line[0].substr(-9) === '.history/' ? ' history' : '') + (line[0].substr(-1) === '/' ? ' dir' : '');
			file.textContent = file.title = line[0].replace('.history/', '');
			if(line[0].substr(-1) === '/') {
				file.addEventListener('click', function() {
					open(path + line[0]);
				});
			}
			if(isHistory) {
				var restore = document.createElement('div');
				restore.className = 'restore';
				restore.addEventListener('click', function() {
					airborn.fs.getFile(path + line[0], {codec: 'raw'}, function(contents) {
						airborn.fs.putFile(path.replace('.history/', ''), {codec: 'raw'}, contents);
					});
				});
				files.insertBefore(restore, files.firstChild);
				files.insertBefore(file, files.firstChild);
			} else {
				files.appendChild(file);
			}
		}
	});
}

open('/Documents/');

airborn.addEventListener('openFileRequest', open);

airborn.fs.listenForFileChanges('/Documents/', function(changed, reason) {
	var cur = currentPath.replace('.history/', '');
	if(changed.substr(0, cur.length) === cur) {
		open(currentPath);
	}
});

document.getElementById('up').addEventListener('click', function() {
	open(airborn.path.dirname(currentPath));
});

function chunkify(t) {
	var tz = new Array();
	var x = 0, y = -1, n = 0, i, j;

	while (i = (j = t.charAt(x++)).charCodeAt(0)) {
		var m = (i == 46 || (i >=48 && i <= 57));
		if (m !== n) {
			tz[++y] = "";
			n = m;
		}
		tz[y] += j;
	}
	return tz;
}

function alphanum(a, b) {
	var aa = chunkify(a[0]);
	var bb = chunkify(b[0]);

	for (x = 0; aa[x] || bb[x]; x++) {
		if (!aa[x] || !bb[x]) {
			return aa[x] ? 1 : -1;
		}
		if (aa[x] !== bb[x] && Number(aa[x]) !== Number(bb[x])) {
			var c = Number(aa[x]), d = Number(bb[x]);
			if (c == aa[x] && d == bb[x]) {
				return c - d;
			} else return (aa[x] > bb[x]) ? 1 : -1;
		}
	}
	return aa.length - bb.length;
}

Array.prototype.alphanumSort = function() {
	return this.sort(alphanum);
};