# Heart Pop

一个清爽 HD 风格的 Phaser 爱心点击小游戏。屏幕上会不断出现会动的爱心，点击后播放爆开心动画并得分。

## Run

在电脑上从这个文件夹启动本地服务器：

```powershell
python tools/serve.py
```

然后打开：

```text
http://localhost:8082
```

## Open On Phone

手机不能直接打开电脑上的 `localhost`，需要手机和电脑连在同一个 Wi-Fi，然后用电脑的局域网 IP 访问，例如：

```text
http://10.193.5.46:8082
```

如果打不开，通常是 Windows 防火墙拦住了 Python。允许 Python 通过专用网络后再试。

## GitHub Pages

这个项目是静态网页，可以直接部署到 GitHub Pages：

1. 创建一个公开仓库。
2. 上传本文件夹里的所有文件到仓库根目录。
3. 在 GitHub 仓库 Settings -> Pages 中选择 `Deploy from a branch`，分支选 `main`，目录选 `/root`。
4. 保存后等待 GitHub 生成访问链接。

## Hidden Love Mode

游戏右上角有一个小爱心锁按钮，点击后输入密码：

```text
5201314
```

密码正确后会进入固定照片告白模式。这个模式会按顺序播放 `assets/love-photos/` 里的 20 张照片，底部持续飘出爱心，最后出现大爱心爆开并显示：

```text
我爱你，杨芳
```

这些照片会随公开 GitHub Pages 网页一起公开加载，分享链接给朋友后，对方输入密码也能看到同一组照片。

## Outputs

- `assets/sprites/heart-idle.png`
- `assets/sprites/heart-pop.png`
- `assets/sprites/sparkle-loop.png`
- `assets/sprites/score-pop.png`
- `assets/love-photos/love-photo-01.jpg` 到 `assets/love-photos/love-photo-20.jpg`
- `exports/gameplay-demo.gif`

## License

MIT
