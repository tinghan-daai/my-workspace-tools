# 把本機暫存的 PNG 序列用 ffmpeg 合成高畫質 MP4，輸出回 Google Drive 資料夾
import os, sys, subprocess, tempfile, glob
import imageio_ffmpeg

FPS = 30
here = os.path.dirname(os.path.abspath(__file__))
# 優先：命令列指定 > capture 寫的 sidecar > 預設 temp
sidecar = os.path.join(here, '_framesdir.txt')
if len(sys.argv) > 1:
    frames_dir = sys.argv[1]
elif os.path.isfile(sidecar):
    frames_dir = open(sidecar, encoding='utf-8').read().strip()
else:
    frames_dir = os.path.join(tempfile.gettempdir(), 'tjforum_kv', 'frames')
out_path = os.path.join(here, '2026台日論壇_動態主視覺_1920x1080.mp4')

n = len(glob.glob(os.path.join(frames_dir, 'f*.png')))
if n == 0:
    print('找不到 frames，請先跑 node capture.js'); sys.exit(1)
print(f'frames: {n}  ({n/FPS:.1f}s)')

ff = imageio_ffmpeg.get_ffmpeg_exe()
cmd = [ff, '-y',
       '-framerate', str(FPS),
       '-i', os.path.join(frames_dir, 'f%04d.png'),
       '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
       '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
       out_path]
print('ffmpeg:', ff)
r = subprocess.run(cmd, capture_output=True)  # bytes，避免 cp950 解碼錯誤
if r.returncode != 0:
    print(r.stderr[-2000:].decode('utf-8', 'ignore')); sys.exit(r.returncode)
print('OK →', out_path, f'{os.path.getsize(out_path)/1048576:.1f}MB')
