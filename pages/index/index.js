Page({
  data: {
    tempImagePath: '',
    colorResults: [],
    rewardedVideoAd: null,
    isAdLoaded: false,
    isZoomed: false,
    selectionMode: 'area', // 默认使用框选模式
    isSelecting: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    selectionBoxStyle: '',
    selectionStyle: '',
    selectedColor: '',
    longPressTimer: null,
    imageInfo: null,
    originalWidth: 0,
    originalHeight: 0,
    scale: 1,
    selectionColors: [],
    zoomScale: 1.0
  },

  onLoad: function() {
    // 初始化广告等现有代码
    
    // 确保 Canvas 正确初始化
    const query = wx.createSelectorQuery();
    query.select('#colorCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res && res[0]) {
          console.log('Canvas 初始化成功');
        } else {
          console.error('Canvas 初始化失败');
        }
      });
  },

  // 选择图片
  chooseImage: function() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          tempImagePath: tempFilePath,
          selectedColor: null
        });
        this.analyzeImage(tempFilePath);
        this.getImageInfo(tempFilePath);
      }
    });
  },

  // 拍摄照片
  takePhoto: function() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          tempImagePath: tempFilePath,
          selectedColor: null
        });
        this.analyzeImage(tempFilePath);
        this.getImageInfo(tempFilePath);
      }
    });
  },

  // 获取图片信息
  getImageInfo: function(imagePath) {
    wx.getImageInfo({
      src: imagePath,
      success: (res) => {
        this.setData({
          imageInfo: res,
          originalWidth: res.width,
          originalHeight: res.height
        });
        // 将图片绘制到隐藏的canvas上，用于后续颜色提取
        this.drawImageToCanvas(imagePath, res.width, res.height);
      }
    });
  },

  // 将图片绘制到Canvas
  drawImageToCanvas: function(imagePath, width, height) {
    const ctx = wx.createCanvasContext('colorCanvas');
    ctx.drawImage(imagePath, 0, 0, width, height);
    ctx.draw(false, () => {
      console.log('图片已绘制到Canvas');
    });
  },

  // 分析图片颜色
  analyzeImage: function(imagePath) {
    // 显示加载中提示
    wx.showLoading({
      title: '正在识别颜色...',
    });
    
    // 调用颜色分析函数
    setTimeout(() => {
      const colors = this.analyzeImageColors(imagePath);
      
      // 特殊处理：不设置 selectedColor
      this.setData({
        colorResults: colors,
        selectedColor: null, // 不设置选中颜色
        selectionColors: [] // 清空框选结果
      });
      
      wx.hideLoading();
      
      // 显示成功提示
      wx.showToast({
        title: '颜色分析成功',
        icon: 'success',
        duration: 1500
      });
    }, 1000); // 模拟分析延迟
  },

  // 颜色分析算法
  analyzeImageColors: function(imagePath) {
    // 这里只是模拟返回结果，实际项目中需要实现真正的颜色分析算法
    return [
      {
        hex: '#FF5733',
        rgb: 'RGB(255, 87, 51)',
        name: '橙红色',
        percentage: 45
      },
      {
        hex: '#33A8FF',
        rgb: 'RGB(51, 168, 255)',
        name: '天蓝色',
        percentage: 30
      },
      {
        hex: '#33FF57',
        rgb: 'RGB(51, 255, 87)',
        name: '浅绿色',
        percentage: 25
      }
    ];
  },

  // 复制文本到剪贴板
  copyText: function(e) {
    const text = e.currentTarget.dataset.text;
    wx.setClipboardData({
      data: text,
      success: function() {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        });
      }
    });
  },

  // 切换图片缩放状态
  toggleZoom: function() {
    this.setData({
      isZoomed: !this.data.isZoomed
    });
  },

  // 触摸开始
  touchStart: function(e) {
    console.log('触摸开始', e);
    if (!this.data.tempImagePath) return;
    
    const touch = e.touches[0];
    
    // 记录起始位置
    this.setData({
      startX: touch.clientX,
      startY: touch.clientY,
      endX: touch.clientX,
      endY: touch.clientY
    });
    
    // 长按开始框选
    this.data.longPressTimer = setTimeout(() => {
      console.log('长按触发框选');
      // 显示提示信息
      wx.showToast({
        title: '开始框选',
        icon: 'none',
        duration: 1000
      });
      
      this.setData({
        isSelecting: true,
        selectionBoxStyle: `
          position: absolute;
          left: ${touch.clientX}px; 
          top: ${touch.clientY}px; 
          width: 0px; 
          height: 0px;
          border: 3px solid #ff0000;
          background-color: rgba(255, 0, 0, 0.2);
          pointer-events: none;
          z-index: 100;
          box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
        `
      });
    }, 500); // 长按500ms触发框选
  },

  // 触摸移动
  touchMove: function(e) {
    // 清除长按定时器
    if (this.data.longPressTimer) {
      clearTimeout(this.data.longPressTimer);
      this.data.longPressTimer = null;
    }
    
    if (this.data.isSelecting) {
      const touch = e.touches[0];
      
      // 计算选择框的尺寸
      const left = Math.min(this.data.startX, touch.clientX);
      const top = Math.min(this.data.startY, touch.clientY);
      const width = Math.abs(touch.clientX - this.data.startX);
      const height = Math.abs(touch.clientY - this.data.startY);
      
      // 更新选择框样式
      this.setData({
        endX: touch.clientX,
        endY: touch.clientY,
        selectionBoxStyle: `
          position: absolute;
          left: ${left}px; 
          top: ${top}px; 
          width: ${width}px; 
          height: ${height}px;
          border: 3px solid #ff0000;
          background-color: rgba(255, 0, 0, 0.2);
          pointer-events: none;
          z-index: 100;
          box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
        `
      });
      
      // 如果选择框足够大，显示尺寸信息
      if (width > 30 && height > 30) {
        // 可以在这里添加额外的视觉反馈，比如显示选择框的尺寸
        console.log(`选择框尺寸: ${width} x ${height}`);
      }
    }
  },

  // 触摸结束
  touchEnd: function(e) {
    // 清除长按定时器
    if (this.data.longPressTimer) {
      clearTimeout(this.data.longPressTimer);
      this.data.longPressTimer = null;
    }
    
    if (this.data.isSelecting) {
      // 计算选择框的尺寸
      const width = Math.abs(this.data.endX - this.data.startX);
      const height = Math.abs(this.data.endY - this.data.startY);
      
      // 如果选择框太小，提示用户
      if (width < 10 || height < 10) {
        wx.showToast({
          title: '选择区域太小',
          icon: 'none',
          duration: 1500
        });
        
        this.setData({
          isSelecting: false,
          selectionBoxStyle: ''
        });
        return;
      }
      
      // 显示正在分析的提示
      wx.showToast({
        title: '正在分析选中区域...',
        icon: 'loading',
        duration: 2000
      });
      
      // 获取框选区域的主要颜色
      this.getAreaColors();
      
      // 保持选择框显示一段时间，然后隐藏
      setTimeout(() => {
        this.setData({
          isSelecting: false
        });
      }, 1000);
    }
  },

  // 获取框选区域的主要颜色
  getAreaColors: function() {
    console.log('开始获取框选区域颜色');
    if (!this.data.tempImagePath) return;
    
    wx.showLoading({
      title: '正在分析区域颜色...',
      mask: true
    });
    
    // 使用更可靠的方法获取图片位置
    try {
      // 直接使用图片预览区域的尺寸作为参考
      const imagePreviewWidth = wx.getSystemInfoSync().windowWidth - 40; // 减去容器的padding
      const imagePreviewHeight = 400 / 750 * wx.getSystemInfoSync().windowWidth; // rpx转px
      
      console.log('图片预览区域尺寸:', imagePreviewWidth, imagePreviewHeight);
      
      // 计算选择框在图片上的相对位置
      // 注意：这里假设图片完全填充了预览区域，可能需要根据实际情况调整
      const startX = Math.min(this.data.startX, this.data.endX) / imagePreviewWidth;
      const startY = Math.min(this.data.startY, this.data.endY) / imagePreviewHeight;
      const width = Math.abs(this.data.endX - this.data.startX) / imagePreviewWidth;
      const height = Math.abs(this.data.endY - this.data.startY) / imagePreviewHeight;
      
      console.log('选择框相对位置:', startX, startY, width, height);
      
      // 确保选择区域有效
      if (width > 0.01 && height > 0.01) {
        // 使用 Canvas 2D API 获取区域颜色
        const canvasQuery = wx.createSelectorQuery();
        canvasQuery.select('#colorCanvas')
          .fields({ node: true, size: true })
          .exec((canvasRes) => {
            if (!canvasRes || !canvasRes[0] || !canvasRes[0].node) {
              console.error('Canvas 初始化失败');
              wx.hideLoading();
              wx.showToast({
                title: 'Canvas 初始化失败',
                icon: 'none'
              });
              return;
            }
            
            const canvas = canvasRes[0].node;
            const ctx = canvas.getContext('2d');
            
            // 设置 Canvas 大小
            canvas.width = 300;
            canvas.height = 300;
            
            // 创建图片对象
            const img = canvas.createImage();
            img.src = this.data.tempImagePath;
            
            img.onload = () => {
              // 绘制图片到 Canvas
              ctx.drawImage(img, 0, 0, 300, 300);
              
              // 获取区域像素数据
              const pixelX = Math.max(0, Math.floor(startX * 300));
              const pixelY = Math.max(0, Math.floor(startY * 300));
              const pixelWidth = Math.max(1, Math.floor(width * 300));
              const pixelHeight = Math.max(1, Math.floor(height * 300));
              
              console.log('区域像素坐标:', pixelX, pixelY, pixelWidth, pixelHeight);
              
              try {
                const imageData = ctx.getImageData(pixelX, pixelY, pixelWidth, pixelHeight);
                
                // 分析区域内的颜色
                const colors = this.analyzeAreaImageData(imageData.data, pixelWidth, pixelHeight);
                
                if (colors && colors.length > 0) {
                  // 直接更新状态
                  this.setData({
                    selectedColor: colors[0], // 主要颜色
                    colorResults: [], // 清空普通识别结果
                    selectionColors: colors.slice(0, 3).map(color => ({
                      color: color.hex,
                      rgb: color.rgb,
                      percentage: color.percentage
                    }))
                  });
                  
                  wx.hideLoading();
                  
                  wx.showToast({
                    title: '颜色分析成功',
                    icon: 'success',
                    duration: 1500
                  });
                } else {
                  wx.hideLoading();
                  wx.showToast({
                    title: '未能识别颜色',
                    icon: 'none'
                  });
                }
              } catch (error) {
                console.error('获取区域像素数据失败:', error);
                wx.hideLoading();
                wx.showToast({
                  title: '获取区域颜色失败',
                  icon: 'none'
                });
              }
            };
            
            img.onerror = (err) => {
              console.error('图片加载失败:', err);
              wx.hideLoading();
              wx.showToast({
                title: '图片加载失败',
                icon: 'none'
              });
            };
          });
      } else {
        wx.hideLoading();
        wx.showToast({
          title: '选择区域太小',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('获取图片位置失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '获取图片位置失败',
        icon: 'none'
      });
    }
  },

  // 分析指定点的颜色
  analyzeColorAtPoint: function(relativeX, relativeY) {
    // 显示加载提示
    wx.showLoading({
      title: '正在识别颜色...',
      mask: true
    });
    
    const query = wx.createSelectorQuery();
    query.select('#colorCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          wx.hideLoading();
          wx.showToast({
            title: 'Canvas 初始化失败',
            icon: 'none'
          });
          return;
        }
        
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        
        // 设置 Canvas 大小
        canvas.width = 300;
        canvas.height = 300;
        
        // 创建图片对象
        const img = canvas.createImage();
        img.src = this.data.tempImagePath;
        
        img.onload = () => {
          // 绘制图片到 Canvas
          ctx.drawImage(img, 0, 0, 300, 300);
          
          // 获取像素数据
          const x = Math.floor(relativeX * 300);
          const y = Math.floor(relativeY * 300);
          const imageData = ctx.getImageData(x, y, 1, 1);
          
          // 获取像素颜色
          const r = imageData.data[0];
          const g = imageData.data[1];
          const b = imageData.data[2];
          
          // 转换为十六进制颜色
          const hex = this.rgbToHex(r, g, b);
          const rgb = `rgb(${r}, ${g}, ${b})`;
          const colorName = this.getColorName(r, g, b);
          
          // 创建单个颜色结果
          const colorResult = {
            hex: hex,
            rgb: rgb,
            name: colorName,
            percentage: 100 // 点选时为100%
          };
          
          // 直接更新状态
          this.setData({
            selectedColor: colorResult, // 点选时设置选中颜色
            colorResults: [colorResult], // 更新颜色结果
            selectionColors: [] // 清空框选结果
          });
          
          wx.hideLoading();
          
          wx.showToast({
            title: '颜色分析成功',
            icon: 'success',
            duration: 1500
          });
        };
        
        img.onerror = () => {
          wx.hideLoading();
          wx.showToast({
            title: '图片加载失败',
            icon: 'none'
          });
        };
      });
  },

  // 添加新的 analyzeAreaColors 函数
  analyzeAreaColors: function(startX, startY, width, height) {
    // 显示加载提示
    wx.showLoading({
      title: '正在分析区域颜色...',
      mask: true
    });
    
    const ctx = wx.createCanvasContext('colorCanvas');
    
    // 在画布上绘制图片
    ctx.drawImage(this.data.tempImagePath, 0, 0, 300, 300);
    ctx.draw(true, () => {
      // 图片绘制完成后，获取像素数据
      setTimeout(() => {
        wx.canvasGetImageData({
          canvasId: 'colorCanvas',
          x: Math.floor(startX * 300),
          y: Math.floor(startY * 300),
          width: Math.max(1, Math.floor(width * 300)),
          height: Math.max(1, Math.floor(height * 300)),
          success: res => {
            // 分析区域内的颜色
            const colors = this.analyzeColors(res.data, res.width, res.height);
            
            if (colors && colors.length > 0) {
              // 更新选中的颜色和颜色结果
              this.processColorResults(colors, true);
            } else {
              wx.hideLoading();
              wx.showToast({
                title: '未能识别颜色',
                icon: 'none'
              });
            }
          },
          fail: err => {
            console.error('获取区域颜色失败', err);
            wx.hideLoading();
            wx.showToast({
              title: '获取区域颜色失败',
              icon: 'none'
            });
          }
        });
      }, 300); // 增加延迟确保画布已经绘制完成
    });
  },

  // RGB 转 HEX
  rgbToHex: function(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  },

  // 分析颜色
  analyzeColors: function(data, width, height) {
    // 颜色量化，减少颜色数量
    const colorMap = {};
    const pixelCount = width * height;
    
    // 颜色量化步长，值越大颜色越少
    const quantStep = 8;
    
    for (let i = 0; i < data.length; i += 4) {
      // 量化RGB值
      const r = Math.floor(data[i] / quantStep) * quantStep;
      const g = Math.floor(data[i + 1] / quantStep) * quantStep;
      const b = Math.floor(data[i + 2] / quantStep) * quantStep;
      const a = data[i + 3];
      
      // 忽略透明像素
      if (a < 128) continue;
      
      const hex = this.rgbToHex(r, g, b);
      
      if (colorMap[hex]) {
        colorMap[hex].count++;
      } else {
        colorMap[hex] = {
          hex: this.rgbToHex(data[i], data[i+1], data[i+2]), // 保存原始颜色
          rgb: `RGB(${data[i]}, ${data[i+1]}, ${data[i+2]})`,
          count: 1
        };
      }
    }
    
    // 转换为数组并排序
    const colorArray = Object.values(colorMap);
    colorArray.sort((a, b) => b.count - a.count);
    
    // 返回前5种主要颜色
    return colorArray.slice(0, 5).map(color => {
      const rgb = color.rgb.match(/\d+/g);
      return {
        hex: color.hex,
        rgb: color.rgb,
        name: this.getColorName(parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2])),
        percentage: Math.round((color.count / pixelCount) * 100) + '%'
      };
    });
  },

  // 获取颜色名称
  getColorName: function(r, g, b) {
    // 这里可以实现颜色名称识别算法
    // 简单示例：根据RGB值返回基本颜色名称
    if (r > 200 && g < 100 && b < 100) return '红色';
    if (r > 200 && g > 150 && b < 100) return '橙色';
    if (r > 200 && g > 200 && b < 100) return '黄色';
    if (r < 100 && g > 200 && b < 100) return '绿色';
    if (r < 100 && g < 100 && b > 200) return '蓝色';
    if (r > 150 && g < 100 && b > 150) return '紫色';
    if (r > 200 && g > 200 && b > 200) return '白色';
    if (r < 100 && g < 100 && b < 100) return '黑色';
    if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30) return '灰色';
    
    return '未知颜色';
  },

  // 修改 bindtap 事件处理函数，防止图片放大
  bindtap: function(e) {
    // 获取点击位置
    const x = e.detail.x;
    const y = e.detail.y;
    
    // 获取图片在画布中的实际位置和尺寸
    const { imageLeft, imageTop, imageWidth, imageHeight } = this.calculateImageRect();
    
    // 检查点击是否在图片范围内
    if (x >= imageLeft && x <= imageLeft + imageWidth && 
        y >= imageTop && y <= imageTop + imageHeight) {
      // 将点击坐标转换为图片上的坐标
      const imageX = Math.floor(((x - imageLeft) / imageWidth) * this.data.originalWidth);
      const imageY = Math.floor(((y - imageTop) / imageHeight) * this.data.originalHeight);
      
      // 获取颜色
      this.getPixelColor(imageX, imageY);
    }
    
    // 不再调用放大功能
  },

  // 计算图片在画布中的实际位置和尺寸
  calculateImageRect: function() {
    const rect = wx.createSelectorQuery().select('.image-preview image').boundingClientRect();
    rect.exec((res) => {
      if (!res || !res[0]) return;
      
      const imageRect = res[0];
      const scaleX = this.data.imageInfo.width / imageRect.width;
      const scaleY = this.data.imageInfo.height / imageRect.height;
      
      const imageLeft = Math.floor(imageRect.left * scaleX);
      const imageTop = Math.floor(imageRect.top * scaleY);
      const imageWidth = Math.floor(imageRect.width * scaleX);
      const imageHeight = Math.floor(imageRect.height * scaleY);
      
      return { imageLeft, imageTop, imageWidth, imageHeight };
    });
  },

  // 获取像素颜色
  getPixelColor: function(x, y) {
    const ctx = wx.createCanvasContext('myCanvas');
    ctx.drawImage(this.data.tempImagePath, 0, 0, this.data.originalWidth, this.data.originalHeight);
    ctx.draw(false, () => {
      wx.canvasGetImageData({
        canvasId: 'myCanvas',
        x: x,
        y: y,
        width: 1,
        height: 1,
        success: (res) => {
          const r = res.data[0];
          const g = res.data[1];
          const b = res.data[2];
          const a = res.data[3] / 255;
          const color = `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
          
          // 更新选中的颜色
          this.setData({
            selectedColor: color
          });
          
          console.log(`点击位置 (${x}, ${y}) 的颜色: ${color}`);
        },
        fail: (err) => {
          console.error('获取像素颜色失败:', err);
        }
      });
    });
  },

  // 修改缩放处理函数，只在两个手指时才缩放
  bindscale: function(e) {
    // 检查是否有两个触摸点
    if (e.touches && e.touches.length === 2) {
      const newScale = this.data.scale * e.scale;
      // 限制缩放范围
      if (newScale >= 0.5 && newScale <= 3) {
        this.setData({
          scale: newScale
        });
      }
    }
  },

  // 修改触摸结束处理函数，分析框选区域的颜色
  bindtouchend: function(e) {
    if (this.data.isSelecting) {
      this.setData({
        isSelecting: false
      });
      
      // 计算选择框的坐标和尺寸
      const { startX, startY, endX, endY } = this.data;
      const selectionX = Math.min(startX, endX);
      const selectionY = Math.min(startY, endY);
      const selectionWidth = Math.abs(endX - startX);
      const selectionHeight = Math.abs(endY - startY);
      
      // 确保选择区域有效
      if (selectionWidth > 5 && selectionHeight > 5) {
        // 获取框选区域的图像数据
        this.getSelectionColors(selectionX, selectionY, selectionWidth, selectionHeight);
      } else {
        // 如果选择区域太小，清空框选颜色
        this.setData({
          selectionColors: []
        });
      }
    }
  },

  // 添加获取框选区域主要颜色的函数
  getSelectionColors: function(x, y, width, height) {
    const ctx = wx.createCanvasContext('myCanvas');
    ctx.drawImage(this.data.tempImagePath, 0, 0, this.data.originalWidth, this.data.originalHeight);
    ctx.draw(false, () => {
      wx.canvasGetImageData({
        canvasId: 'myCanvas',
        x: x,
        y: y,
        width: width,
        height: height,
        success: (res) => {
          // 分析颜色
          const colorMap = {};
          const totalPixels = width * height;
          
          // 遍历所有像素
          for (let i = 0; i < res.data.length; i += 4) {
            const r = res.data[i];
            const g = res.data[i + 1];
            const b = res.data[i + 2];
            // 简化颜色，将相近颜色归为一组
            const simplifiedR = Math.floor(r / 10) * 10;
            const simplifiedG = Math.floor(g / 10) * 10;
            const simplifiedB = Math.floor(b / 10) * 10;
            const colorKey = `rgb(${simplifiedR}, ${simplifiedG}, ${simplifiedB})`;
            
            if (colorMap[colorKey]) {
              colorMap[colorKey]++;
            } else {
              colorMap[colorKey] = 1;
            }
          }
          
          // 将颜色按出现频率排序
          const sortedColors = Object.keys(colorMap).map(color => ({
            color: color,
            count: colorMap[color],
            percentage: ((colorMap[color] / totalPixels) * 100).toFixed(1)
          })).sort((a, b) => b.count - a.count);
          
          // 获取前三个主要颜色
          const mainColors = sortedColors.slice(0, 3);
          
          this.processColorResults(mainColors, true);
        },
        fail: (err) => {
          console.error('获取框选区域颜色失败:', err);
        }
      });
    });
  },

  // 处理图片点击事件
  handleImageTap: function(e) {
    console.log('图片被点击', e);
    // 在框选模式下，点击图片切换缩放状态
    this.toggleZoom();
  },

  // 获取点击位置的颜色
  getColorAtPoint: function(e) {
    if (!this.data.tempImagePath) return;
    
    const touch = e.touches ? e.touches[0] : e;
    const { x, y } = touch;
    
    // 获取图片在屏幕上的位置和尺寸
    const query = wx.createSelectorQuery();
    query.select('.image-preview image').boundingClientRect();
    query.exec(res => {
      if (!res || !res[0]) return;
      
      const imageRect = res[0];
      
      // 计算点击在图片上的相对位置（0-1之间）
      const relativeX = (x - imageRect.left) / imageRect.width;
      const relativeY = (y - imageRect.top) / imageRect.height;
      
      // 确保点击在图片范围内
      if (relativeX >= 0 && relativeX <= 1 && relativeY >= 0 && relativeY <= 1) {
        this.analyzeColorAtPoint(relativeX, relativeY);
      }
    });
  },

  // 放大图片
  zoomIn: function() {
    // 如果已经有缩放比例，则增加缩放比例
    let zoomScale = this.data.zoomScale || 1.0;
    zoomScale = Math.min(zoomScale + 0.2, 3.0); // 限制最大缩放比例为3倍
    
    this.setData({
      zoomScale: zoomScale,
      isZoomed: true,
      selectionStyle: `transform: scale(${zoomScale}); transform-origin: center center;`
    });
  },

  // 缩小图片
  zoomOut: function() {
    // 如果已经有缩放比例，则减小缩放比例
    let zoomScale = this.data.zoomScale || 1.0;
    zoomScale = Math.max(zoomScale - 0.2, 0.5); // 限制最小缩放比例为0.5倍
    
    this.setData({
      zoomScale: zoomScale,
      isZoomed: zoomScale > 1.0,
      selectionStyle: `transform: scale(${zoomScale}); transform-origin: center center;`
    });
  },

  // 使用 Canvas 2D API 获取像素颜色
  getPixelColorWithCanvas2D: function(e) {
    console.log('开始获取像素颜色', e);
    if (!this.data.tempImagePath) return;
    
    wx.showLoading({
      title: '正在识别颜色...',
      mask: true
    });
    
    // 获取点击位置
    const touch = e.touches ? e.touches[0] : e;
    
    // 获取图片在屏幕上的位置和尺寸
    const query = wx.createSelectorQuery();
    query.select('.image-preview image').boundingClientRect();
    query.exec(res => {
      if (!res || !res[0]) {
        wx.hideLoading();
        wx.showToast({
          title: '无法获取图片位置',
          icon: 'none'
        });
        return;
      }
      
      const imageRect = res[0];
      console.log('图片位置信息:', imageRect);
      
      // 计算点击在图片上的相对位置
      const x = touch.clientX - imageRect.left;
      const y = touch.clientY - imageRect.top;
      
      // 确保点击在图片范围内
      if (x >= 0 && x <= imageRect.width && y >= 0 && y <= imageRect.height) {
        // 计算相对坐标（0-1之间）
        const relativeX = x / imageRect.width;
        const relativeY = y / imageRect.height;
        console.log('相对坐标:', relativeX, relativeY);
        
        // 使用 Canvas 2D API 获取颜色
        const canvasQuery = wx.createSelectorQuery();
        canvasQuery.select('#colorCanvas')
          .fields({ node: true, size: true })
          .exec((canvasRes) => {
            if (!canvasRes || !canvasRes[0] || !canvasRes[0].node) {
              wx.hideLoading();
              wx.showToast({
                title: 'Canvas 初始化失败',
                icon: 'none'
              });
              return;
            }
            
            const canvas = canvasRes[0].node;
            const ctx = canvas.getContext('2d');
            
            // 设置 Canvas 大小
            canvas.width = 300;
            canvas.height = 300;
            
            // 创建图片对象
            const img = canvas.createImage();
            img.src = this.data.tempImagePath;
            
            img.onload = () => {
              // 绘制图片到 Canvas
              ctx.drawImage(img, 0, 0, 300, 300);
              
              // 获取像素数据
              const pixelX = Math.floor(relativeX * 300);
              const pixelY = Math.floor(relativeY * 300);
              console.log('像素坐标:', pixelX, pixelY);
              
              try {
                const imageData = ctx.getImageData(pixelX, pixelY, 1, 1);
                
                // 获取像素颜色
                const r = imageData.data[0];
                const g = imageData.data[1];
                const b = imageData.data[2];
                
                console.log('获取到的颜色:', r, g, b);
                
                // 转换为十六进制颜色
                const hex = this.rgbToHex(r, g, b);
                const rgb = `rgb(${r}, ${g}, ${b})`;
                const colorName = this.getColorName(r, g, b);
                
                // 创建单个颜色结果
                const colorResult = {
                  hex: hex,
                  rgb: rgb,
                  name: colorName,
                  percentage: 100 // 点选时为100%
                };
                
                // 直接更新状态
                this.setData({
                  selectedColor: colorResult, // 点选时设置选中颜色
                  colorResults: [colorResult], // 更新颜色结果
                  selectionColors: [] // 清空框选结果
                });
                
                wx.hideLoading();
                
                wx.showToast({
                  title: '颜色分析成功',
                  icon: 'success',
                  duration: 1500
                });
              } catch (error) {
                console.error('获取像素数据失败:', error);
                wx.hideLoading();
                wx.showToast({
                  title: '获取颜色失败',
                  icon: 'none'
                });
              }
            };
            
            img.onerror = (err) => {
              console.error('图片加载失败:', err);
              wx.hideLoading();
              wx.showToast({
                title: '图片加载失败',
                icon: 'none'
              });
            };
          });
      } else {
        wx.hideLoading();
        wx.showToast({
          title: '点击位置在图片外',
          icon: 'none'
        });
      }
    });
  },

  // 添加 analyzeAreaImageData 函数，用于分析区域像素数据
  analyzeAreaImageData: function(data, width, height) {
    console.log('分析区域像素数据:', width, height);
    
    // 创建颜色计数对象
    const colorCounts = {};
    const totalPixels = width * height;
    
    // 遍历所有像素
    for (let i = 0; i < totalPixels; i++) {
      const offset = i * 4;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      
      // 忽略完全透明的像素
      if (data[offset + 3] === 0) continue;
      
      // 将颜色量化，减少颜色数量
      const quantizedR = Math.round(r / 10) * 10;
      const quantizedG = Math.round(g / 10) * 10;
      const quantizedB = Math.round(b / 10) * 10;
      
      // 创建颜色键
      const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
      
      // 增加颜色计数
      if (colorCounts[colorKey]) {
        colorCounts[colorKey].count++;
      } else {
        colorCounts[colorKey] = {
          r: quantizedR,
          g: quantizedG,
          b: quantizedB,
          count: 1
        };
      }
    }
    
    // 将颜色计数转换为数组并排序
    const colorArray = Object.values(colorCounts);
    colorArray.sort((a, b) => b.count - a.count);
    
    // 取前3个主要颜色
    const mainColors = colorArray.slice(0, 3);
    
    // 格式化结果
    const result = mainColors.map(color => {
      const hex = this.rgbToHex(color.r, color.g, color.b);
      const rgb = `rgb(${color.r}, ${color.g}, ${color.b})`;
      const percentage = Math.round((color.count / totalPixels) * 100);
      
      return {
        hex: hex,
        rgb: rgb,
        name: this.getColorName(color.r, color.g, color.b),
        percentage: percentage
      };
    });
    
    console.log('分析结果 (前3个主要颜色):', result);
    return result;
  },

  // 恢复 processColorResults 函数的原始行为
  processColorResults: function(colors, isAreaSelection = false) {
    console.log('处理颜色结果:', colors, isAreaSelection ? '框选模式' : '点选/整图模式');
    
    if (!colors || colors.length === 0) {
      console.error('没有颜色结果可处理');
      return;
    }
    
    // 更新选中的颜色和颜色结果
    if (isAreaSelection) {
      // 框选模式
      this.setData({
        selectedColor: colors[0], // 主要颜色
        colorResults: [], // 清空普通识别结果
        selectionColors: colors.slice(0, 3).map(color => ({
          color: color.hex,
          rgb: color.rgb,
          percentage: color.percentage
        }))
      });
    } else {
      // 点选或整图模式
      this.setData({
        selectedColor: colors[0], // 主要颜色
        colorResults: colors, // 所有颜色
        selectionColors: [] // 清空框选结果
      });
    }
    
    wx.hideLoading();
    
    // 显示成功提示
    wx.showToast({
      title: '颜色分析成功',
      icon: 'success',
      duration: 1500
    });
  }
}); 