import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FF = "C:\\Program Files (x86)\\YouTube Playlist Downloader\\ffmpeg.exe";
const VO = join(__dirname, "voiceover");
const RAW = join(__dirname, "raw");
const OUT = join(__dirname, "out");
const TMP = join(__dirname, "..", "tmp");

mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

function run(cmd) {
  return execSync(cmd, { stdio: "pipe", encoding: "utf-8" });
}
function log(msg) { console.log(msg); }

// Step 1: Concatenate raw videos (no audio)
log("🎬 Step 1: Combining raw videos...");
const videoList = [
  `file '${join(RAW, "guest.webm")}'`,
  `file '${join(RAW, "student.webm")}'`,
  `file '${join(RAW, "admin.webm")}'`,
].join("\n");
writeFileSync(join(TMP, "video_list.txt"), videoList);
run(`"${FF}" -f concat -safe 0 -i "${join(TMP, "video_list.txt")}" -c copy -an "${join(TMP, "combined_video.webm")}"`);
log("✓ Video combined");

// Step 2: Concatenate voiceover MP3s in order
log("🎙️ Step 2: Combining voiceover...");
const voOrder = [
  "intro", "g1", "g2", "g3", "g4", "g5", "g6", "g7",
  "s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9",
  "a1", "a2", "a3", "a4", "a5", "a6", "a7", "outro",
];
const audioList = voOrder.map(id => `file '${join(VO, `${id}.mp3`)}`).join("\n");
writeFileSync(join(TMP, "audio_list.txt"), audioList);
run(`"${FF}" -f concat -safe 0 -i "${join(TMP, "audio_list.txt")}" -c:a libmp3lame -b:a 128k "${join(TMP, "voiceover.mp3")}"`);
log("✓ Voiceover combined");

// Step 3: Generate ambient cinematic drone music (3 minutes)
log("🎵 Step 3: Generating ambient music...");
run(`"${FF}" -f lavfi -i "sine=frequency=65:duration=180" -filter_complex "[0:a]aformat=sample_fmts=s16:channel_layouts=stereo,volume=0.04,apad" "${join(TMP, "music.mp3")}"`);
log("✓ Music generated");

// Step 4: Mix voiceover + music, then encode final MP4
log("🎞️ Step 4: Final encode with audio mix...");
run(`"${FF}" -y -i "${join(TMP, "combined_video.webm")}" -i "${join(TMP, "voiceover.mp3")}" -i "${join(TMP, "music.mp3")}" -filter_complex "[1:a][2:a]amix=inputs=2:duration=first:normalize=0[outa]" -map 0:v -map "[outa]" -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -movflags +faststart "${OUT}/fe-etshoob-demo.mp4"`);

log("\n✅ DONE! Final video:");
const info = run(`"${FF}" -i "${join(OUT, "fe-etshoob-demo.mp4")}" 2>&1`);
log(info.split("\n").filter(l => l.includes("Duration") || l.includes("Stream")).join("\n"));
log(`\n📁 Size: ${execSync(`powershell -Command "(Get-Item '${join(OUT, "fe-etshoob-demo.mp4")}').Length / 1MB"`, { encoding: "utf-8" }).trim()} MB`);
