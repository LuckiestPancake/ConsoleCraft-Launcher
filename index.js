const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");
const https = require("https");
const extractZip = require("extract-zip");
const { exec } = require("child_process");

const dl = "https://github.com/smartcmd/MinecraftConsoles/releases/download/nightly/LCEWindows64.zip";
const gmdir = path.join(__dirname, "gmdir");
const exepath = path.join(gmdir, "Minecraft.Client.exe");
const skinpath = path.join(gmdir, "Common", "res", "mob", "char.png");

const playBtn = document.getElementById("play-button");
const importBtn = document.getElementById("import-skin-button");
const saveBtn = document.getElementById("save-profile-button");
const nameInp = document.querySelector(".input-wide");

async function init() {
  const name = await ipcRenderer.invoke("store-get", "username");
  if (name) nameInp.value = name;
}

saveBtn.onclick = async () => {
  await ipcRenderer.invoke("store-set", "username", nameInp.value);
  alert("Profile saved!");
};

importBtn.onclick = async () => {
  const file = await ipcRenderer.invoke("select-skin");
  if (!file) return;

  if (!fs.existsSync(gmdir)) {
    alert("Please download the game first by clicking Play.");
    return;
  }

  const buf = fs.readFileSync(file);
  const img = new Image();
  img.onload = () => {
    const cvs = document.createElement("canvas");
    cvs.width = 64;
    cvs.height = 32;
    const ctx = cvs.getContext("2d");
    ctx.drawImage(img, 0, 0, 64, 32, 0, 0, 64, 32);
    const b64 = cvs.toDataURL("image/png").split(",")[1];
    const out = Buffer.from(b64, "base64");
    
    const sdir = path.dirname(skinpath);
    if (!fs.existsSync(sdir)) fs.mkdirSync(sdir, { recursive: true });
    fs.writeFileSync(skinpath, out);
    alert("Skin imported!");
  };
  img.src = "data:image/png;base64," + buf.toString("base64");
};

playBtn.onclick = async () => {
  if (!fs.existsSync(exepath)) {
    playBtn.querySelector("p").innerText = "Downloading...";
    playBtn.style.pointerEvents = "none";
    try {
      await getbuild();
      playBtn.querySelector("p").innerText = "Play";
      playBtn.style.pointerEvents = "auto";
      run();
    } catch (err) {
      alert("Download failed: " + err.message);
      playBtn.querySelector("p").innerText = "Play";
      playBtn.style.pointerEvents = "auto";
    }
  } else {
    run();
  }
};

function getbuild() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(gmdir)) fs.mkdirSync(gmdir, { recursive: true });
    const zpath = path.join(gmdir, "LCEWindows64.zip");
    const file = fs.createWriteStream(zpath);

    const get = (url) => {
      https.get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          get(res.headers.location);
          return;
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close(async () => {
            try {
              await extractZip(zpath, { dir: gmdir });
              fs.unlinkSync(zpath);
              resolve();
            } catch (e) {
              reject(e);
            }
          });
        });
      }).on("error", (e) => {
        fs.unlink(zpath, () => reject(e));
      });
    };
    get(dl);
  });
}

function run() {
  const n = nameInp.value || "Player";
  const cmd = `"${exepath}" -name "${n}"`;
  exec(cmd, { cwd: gmdir }, (err) => {
    if (err) alert("Launch error: " + err.message);
  });
}

init();
