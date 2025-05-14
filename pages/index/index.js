Page({
  data: {
    tempImagePath: '',
    colorResults: [],
    rewardedVideoAd: null,
    isAdLoaded: false,
    isZoomed: false,
    selectionMode: 'grid', // 修改为网格模式
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
    zoomScale: 1.0,
    showGrid: true, // 默认启用网格模式
    gridCells: [],
    selectedGridCell: null,
    gridSize: 10, // 设置为固定的5x5网格
    currentAlgorithm: 'kmeans', // 修改为默认使用K-Means聚类算法
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
    
    // 图片加载后初始化网格
    setTimeout(() => {
      if (this.data.tempImagePath) {
        console.log('onLoad 中调用 generateGridCells');
        this.generateGridCells();
      }
    }, 1000); // 增加延迟确保图片已加载

    // 只设置显示网格，不再设置大小
    this.setData({
      showGrid: true
    });
  },

  // 选择图片
  chooseImage: function() {
    try {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album'],
        success: (res) => {
          console.log('选择图片成功:', res);
          const tempFilePath = res.tempFiles[0].tempFilePath;
          
          // 先设置图片路径，再进行其他操作
          this.setData({
            tempImagePath: tempFilePath,
            selectedColor: null,
            selectedGridCell: null,
            colorResults: [], // 清空之前的结果
            selectionColors: [] // 清空框选结果
          });
          
          // 获取图片信息
          this.getImageInfo(tempFilePath);
          
          // 延迟分析图片，确保图片已加载
          setTimeout(() => {
            this.analyzeImage(tempFilePath);
          }, 300);
        },
        fail: (err) => {
          console.error('选择图片失败:', err);
          // 尝试使用旧版API作为备选方案
          this.chooseImageFallback();
        }
      });
    } catch (error) {
      console.error('chooseMedia API调用异常:', error);
      // 尝试使用旧版API作为备选方案
      this.chooseImageFallback();
    }
  },

  // 添加旧版API作为备选方案
  chooseImageFallback: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album'],
      success: (res) => {
        console.log('使用旧版API选择图片成功:', res);
        const tempFilePath = res.tempFilePaths[0];
        
        this.setData({
          tempImagePath: tempFilePath,
          selectedColor: null,
          selectedGridCell: null,
          colorResults: [],
          selectionColors: []
        });
        
        this.getImageInfo(tempFilePath);
        
        setTimeout(() => {
          this.analyzeImage(tempFilePath);
        }, 300);
      },
      fail: (err) => {
        console.error('使用旧版API选择图片也失败:', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 拍摄照片
  takePhoto: function() {
    try {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['camera'],
        success: (res) => {
          console.log('拍照成功:', res);
          const tempFilePath = res.tempFiles[0].tempFilePath;
          
          // 先设置图片路径，再进行其他操作
          this.setData({
            tempImagePath: tempFilePath,
            selectedColor: null,
            selectedGridCell: null,
            colorResults: [], // 清空之前的结果
            selectionColors: [] // 清空框选结果
          });
          
          // 获取图片信息
          this.getImageInfo(tempFilePath);
          
          // 延迟分析图片，确保图片已加载
          setTimeout(() => {
            this.analyzeImage(tempFilePath);
          }, 300);
        },
        fail: (err) => {
          console.error('拍照失败:', err);
          // 尝试使用旧版API作为备选方案
          this.takePhotoFallback();
        }
      });
    } catch (error) {
      console.error('chooseMedia API调用异常:', error);
      // 尝试使用旧版API作为备选方案
      this.takePhotoFallback();
    }
  },

  // 添加旧版API作为备选方案
  takePhotoFallback: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['camera'],
      success: (res) => {
        console.log('使用旧版API拍照成功:', res);
        const tempFilePath = res.tempFilePaths[0];
        
        this.setData({
          tempImagePath: tempFilePath,
          selectedColor: null,
          selectedGridCell: null,
          colorResults: [],
          selectionColors: []
        });
        
        this.getImageInfo(tempFilePath);
        
        setTimeout(() => {
          this.analyzeImage(tempFilePath);
        }, 300);
      },
      fail: (err) => {
        console.error('使用旧版API拍照也失败:', err);
        wx.showToast({
          title: '拍照失败',
          icon: 'none'
        });
      }
    });
  },

  // 获取图片信息
  getImageInfo: function(imagePath) {
    wx.getImageInfo({
      src: imagePath,
      success: (res) => {
        console.log('获取图片信息成功:', res);
        this.setData({
          imageInfo: res,
          originalWidth: res.width,
          originalHeight: res.height
        });
        
        // 使用 Canvas 2D API 绘制图片
        this.drawImageToCanvas2D(imagePath);
      },
      fail: (err) => {
        console.error('获取图片信息失败:', err);
        wx.showToast({
          title: '获取图片信息失败',
          icon: 'none'
        });
      }
    });
  },

  // 使用 Canvas 2D API 绘制图片
  drawImageToCanvas2D: function(imagePath) {
    const query = wx.createSelectorQuery();
    query.select('#colorCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          console.error('Canvas 节点获取失败');
          return;
        }
        
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        
        // 获取图片信息以设置合适的 Canvas 尺寸
        wx.getImageInfo({
          src: imagePath,
          success: (imgInfo) => {
            // 设置 Canvas 大小为图片的实际大小
            // 但限制最大尺寸为 600px，保持性能
            const maxSize = 600;
            let canvasWidth, canvasHeight;
            
            if (imgInfo.width > imgInfo.height) {
              canvasWidth = Math.min(imgInfo.width, maxSize);
              canvasHeight = (imgInfo.height / imgInfo.width) * canvasWidth;
            } else {
              canvasHeight = Math.min(imgInfo.height, maxSize);
              canvasWidth = (imgInfo.width / imgInfo.height) * canvasHeight;
            }
            
            // 设置 Canvas 大小
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            
            // 创建图片对象
            const img = canvas.createImage();
            img.src = imagePath;
            
            img.onload = () => {
              // 清空画布
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              // 绘制图片
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              console.log('图片已绘制到 Canvas 2D，尺寸:', canvasWidth, 'x', canvasHeight);
            };
            
            img.onerror = (err) => {
              console.error('图片加载失败:', err);
            };
          },
          fail: (err) => {
            console.error('获取图片信息失败:', err);
            // 使用默认尺寸
            canvas.width = 300;
            canvas.height = 300;
            
            const img = canvas.createImage();
            img.src = imagePath;
            
            img.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
          }
        });
      });
  },

  // 分析图片颜色
  analyzeImage: function(imagePath) {
    // 显示加载中提示
    wx.showLoading({
      title: '正在识别颜色...',
    });
    
    // 确保图片路径有效
    if (!imagePath) {
      console.error('图片路径为空');
      wx.hideLoading();
      wx.showToast({
        title: '图片路径无效',
        icon: 'none'
      });
      return;
    }
    
    // 确保 Canvas 已准备好
    setTimeout(() => {
      try {
        // 使用Canvas 2D API获取真实颜色
        this.getImageColors(imagePath);
      } catch (error) {
        console.error('颜色分析失败:', error);
        wx.hideLoading();
        wx.showToast({
          title: '颜色分析失败',
          icon: 'none',
          duration: 1500
        });
      }
    }, 500);
  },

  // 替换模拟的颜色分析算法，使用真实的颜色分析
  getImageColors: function(imagePath) {
    const query = wx.createSelectorQuery();
    query.select('#colorCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          console.error('Canvas 初始化失败');
          wx.hideLoading();
          wx.showToast({
            title: 'Canvas 初始化失败',
            icon: 'none'
          });
          return;
        }
        
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        
        // 添加重试机制
        const getImageInfoWithRetry = (src, maxRetries = 3) => {
          let retryCount = 0;
          
          const tryGetImageInfo = () => {
            return new Promise((resolve, reject) => {
              wx.getImageInfo({
                src: src,
                success: resolve,
                fail: (err) => {
                  console.error(`获取图片信息失败 (尝试 ${retryCount + 1}/${maxRetries}):`, err);
                  
                  if (retryCount < maxRetries - 1) {
                    retryCount++;
                    setTimeout(() => {
                      tryGetImageInfo().then(resolve).catch(reject);
                    }, 500 * retryCount); // 递增重试延迟
                  } else {
                    reject(err);
                  }
                }
              });
            });
          };
          
          return tryGetImageInfo();
        };
        
        // 使用重试机制获取图片信息
        getImageInfoWithRetry(imagePath)
          .then((imgInfo) => {
            // 设置 Canvas 大小为图片的实际大小
            // 但限制最大尺寸为 600px，保持性能
            const maxSize = 600;
            let canvasWidth, canvasHeight;
            
            if (imgInfo.width > imgInfo.height) {
              canvasWidth = Math.min(imgInfo.width, maxSize);
              canvasHeight = (imgInfo.height / imgInfo.width) * canvasWidth;
            } else {
              canvasHeight = Math.min(imgInfo.height, maxSize);
              canvasWidth = (imgInfo.width / imgInfo.height) * canvasHeight;
            }
            
            // 设置 Canvas 大小
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            
            // 设置超时处理
            const loadingTimeout = setTimeout(() => {
              wx.hideLoading();
              wx.showToast({
                title: '颜色识别超时',
                icon: 'none'
              });
            }, 10000); // 10秒超时
            
            // 创建图片对象
            const img = canvas.createImage();
            
            img.onload = () => {
              try {
                // 绘制图片到 Canvas
                ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
                
                // 获取整个图片的像素数据
                const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
                
                // 分析图片颜色
                const colors = this.analyzeImageData(imageData.data, canvasWidth, canvasHeight);
                
                // 清除超时计时器
                clearTimeout(loadingTimeout);
                
                if (colors && colors.length > 0) {
                  this.setData({
                    colorResults: colors,
                    selectedColor: colors[0], // 设置第一个颜色为选中颜色
                    selectionColors: [] // 清空框选结果
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
                // 清除超时计时器
                clearTimeout(loadingTimeout);
                
                console.error('分析图片颜色失败:', error);
                wx.hideLoading();
                wx.showToast({
                  title: '分析颜色失败',
                  icon: 'none'
                });
              }
            };
            
            img.onerror = (err) => {
              // 清除超时计时器
              clearTimeout(loadingTimeout);
              
              console.error('图片加载失败:', err);
              wx.hideLoading();
              wx.showToast({
                title: '图片加载失败',
                icon: 'none'
              });
            };
            
            // 设置图片源
            img.src = imagePath;
          })
          .catch((err) => {
            console.error('获取图片信息失败:', err);
            wx.hideLoading();
            wx.showToast({
              title: '获取图片信息失败',
              icon: 'none'
            });
          });
      });
  },

  // 修改颜色识别算法函数，只保留K-Means算法
  analyzeImageData: function(data, width, height) {
    console.log('分析图像数据:', width, height, '数据长度:', data.length);
    
    // 如果没有数据或数据长度不足，返回默认颜色
    if (!data || data.length < 4) {
      console.error('像素数据无效');
      return [{
        hex: '#888888',
        rgb: 'RGB(136, 136, 136)',
        name: '灰色',
        percentage: 100
      }];
    }
    
    try {
      // 直接使用K-Means算法
      return this.analyzeWithKMeans(data, width, height);
    } catch (error) {
      console.error('分析图像数据失败:', error);
      // 返回默认颜色，避免应用崩溃
      return [{
        hex: '#888888',
        rgb: 'RGB(136, 136, 136)',
        name: '灰色',
        percentage: 100
      }];
    }
  },

  // 修改K-Means聚类算法，提高对红色的识别准确度
  analyzeWithKMeans: function(data, width, height) {
    // 1. 均匀+随机采样
    const pixels = [];
    const totalPixels = width * height;
    const sampleCount = Math.min(8000, totalPixels); // 采样点数
    for (let i = 0; i < sampleCount; i++) {
      // 均匀分布采样
      let idx = Math.floor(i * totalPixels / sampleCount);
      let offset = Math.floor(Math.random() * 10); // 加点随机扰动
      idx = Math.min(idx + offset, totalPixels - 1);
      let di = idx * 4;
      let r = data[di], g = data[di + 1], b = data[di + 2], a = data[di + 3];
      if (a < 128) continue;
      pixels.push([r, g, b]);
    }
    if (pixels.length === 0) return [{
      hex: '#888888', rgb: 'RGB(136, 136, 136)', name: '灰色', percentage: 100
    }];

    // 2. 转HSV空间
    const hsvPixels = pixels.map(([r, g, b]) => this.rgbToHsv(r, g, b));

    // 3. K值自适应
    let k = 3;
    if (pixels.length > 4000) k = 4;
    if (pixels.length > 7000) k = 5;

    // 4. K-Means主循环（在HSV空间）
    let centroids = [];
    for (let i = 0; i < k; i++) {
      centroids.push([...hsvPixels[Math.floor(i * hsvPixels.length / k)]]);
    }
    let assignments = new Array(hsvPixels.length).fill(0);
    for (let iter = 0; iter < 15; iter++) {
      // 分配
      let changed = false;
      for (let i = 0; i < hsvPixels.length; i++) {
        let minDist = 1e9, minIdx = 0;
        for (let j = 0; j < k; j++) {
          // H分量要考虑环绕
          let dh = Math.abs(hsvPixels[i][0] - centroids[j][0]);
          dh = Math.min(dh, 360 - dh);
          let ds = hsvPixels[i][1] - centroids[j][1];
          let dv = hsvPixels[i][2] - centroids[j][2];
          let dist = dh * dh * 0.5 + ds * ds * 0.2 + dv * dv * 0.3;
          if (dist < minDist) {
            minDist = dist;
            minIdx = j;
          }
        }
        if (assignments[i] !== minIdx) {
          assignments[i] = minIdx;
          changed = true;
        }
      }
      if (!changed) break;
      // 更新
      let sums = Array(k).fill().map(() => [0, 0, 0]);
      let counts = Array(k).fill(0);
      for (let i = 0; i < hsvPixels.length; i++) {
        let c = assignments[i];
        sums[c][0] += hsvPixels[i][0];
        sums[c][1] += hsvPixels[i][1];
        sums[c][2] += hsvPixels[i][2];
        counts[c]++;
      }
      for (let j = 0; j < k; j++) {
        if (counts[j] > 0) {
          centroids[j][0] = sums[j][0] / counts[j];
          centroids[j][1] = sums[j][1] / counts[j];
          centroids[j][2] = sums[j][2] / counts[j];
        }
      }
    }

    // 5. 聚类统计与剔除小簇
    let clusterCounts = Array(k).fill(0);
    for (let i = 0; i < assignments.length; i++) clusterCounts[assignments[i]]++;
    let result = [];
    for (let j = 0; j < k; j++) {
      if (clusterCounts[j] < pixels.length * 0.03) continue; // 剔除小簇
      // 反推RGB均值
      let rgbSum = [0, 0, 0], cnt = 0;
      for (let i = 0; i < assignments.length; i++) {
        if (assignments[i] === j) {
          rgbSum[0] += pixels[i][0];
          rgbSum[1] += pixels[i][1];
          rgbSum[2] += pixels[i][2];
          cnt++;
        }
      }
      let r = Math.round(rgbSum[0] / cnt);
      let g = Math.round(rgbSum[1] / cnt);
      let b = Math.round(rgbSum[2] / cnt);
      let percent = Math.round((cnt / pixels.length) * 100);
      result.push({
        hex: this.rgbToHex(r, g, b),
        rgb: `RGB(${r}, ${g}, ${b})`,
        name: this.getColorName(r, g, b),
        percentage: percent
      });
    }
    // 6. 主色排序
    result.sort((a, b) => b.percentage - a.percentage);

    // 7. 合并相近色，最多3种
    return this.mergeSimilarColors(result).slice(0, 3);
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

  // 修改图片点击处理函数，移除框选相关逻辑
  handleImageTap: function(e) {
    console.log('图片被点击', e);
    // 不再切换缩放状态，因为我们始终使用网格模式
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

  // 修改 toggleGrid 函数，始终显示网格
  toggleGrid: function() {
    // 不再切换网格显示状态，始终显示网格
    this.generateGridCells();
  },
  
  // 修改网格生成函数，使用固定的网格大小
  generateGridCells: function() {
    console.log('生成网格单元格');
    
    if (!this.data.tempImagePath) {
      console.error('没有图片，无法生成网格');
      return;
    }
    
    // 获取图片容器的尺寸
    const query = wx.createSelectorQuery();
    query.select('.image-preview').boundingClientRect().exec((res) => {
      if (!res || !res[0]) {
        console.error('无法获取图片容器尺寸');
        return;
      }
      
      const containerRect = res[0];
      console.log('图片容器尺寸:', containerRect);
      
      // 获取图片元素的尺寸
      query.select('.image-preview image').boundingClientRect().exec((imgRes) => {
        if (!imgRes || !imgRes[0]) {
          console.error('无法获取图片元素尺寸');
          return;
        }
        
        const imageRect = imgRes[0];
        console.log('图片元素尺寸:', imageRect);
        
        // 计算图片在容器中的实际显示区域
        const imageRatio = this.data.imageInfo ? this.data.imageInfo.width / this.data.imageInfo.height : 1;
        let actualWidth, actualHeight, offsetX = 0, offsetY = 0;
        
        if (imageRatio > containerRect.width / containerRect.height) {
          // 图片宽度适应容器
          actualWidth = imageRect.width;
          actualHeight = actualWidth / imageRatio;
          offsetY = (containerRect.height - actualHeight) / 2;
        } else {
          // 图片高度适应容器
          actualHeight = imageRect.height;
          actualWidth = actualHeight * imageRatio;
          offsetX = (containerRect.width - actualWidth) / 2;
        }
        
        // 使用 this.data.gridSize 而不是硬编码值
        const gridSize = this.data.gridSize;
        const cellWidth = actualWidth / gridSize;
        const cellHeight = actualHeight / gridSize;
        
        const gridCells = [];
        
        // 生成网格单元格，只在图片区域内
        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            gridCells.push({
              id: `${row}-${col}`,
              x: offsetX + col * cellWidth,
              y: offsetY + row * cellHeight,
              width: cellWidth,
              height: cellHeight,
              relativeX: col / gridSize,
              relativeY: row / gridSize
            });
          }
        }
        
        console.log(`生成了 ${gridCells.length} 个网格单元格:`, gridCells[0]);
        
        // 更新状态
        this.setData({ 
          gridCells: gridCells
        });
      });
    });
  },
  
  // 选择网格单元格
  selectGridCell: function(e) {
    console.log('网格单元格被点击', e);
    const { x, y } = e.currentTarget.dataset;
    
    // 获取选中单元格的信息
    const selectedCell = this.data.gridCells.find(
      cell => cell.relativeX === x && cell.relativeY === y
    );
    
    if (selectedCell) {
      console.log('选中网格单元格:', selectedCell);
      
      // 更新选中的网格单元格
      this.setData({ selectedGridCell: selectedCell });
      
      // 分析选中单元格的颜色
      this.analyzeColorAtPoint(x, y);
    } else {
      console.error('未找到匹配的网格单元格');
    }
  },
  
  // 修改图片加载完成处理函数
  onImageLoad: function(e) {
    console.log('图片加载完成', e);
    
    // 确保图片完全加载后再生成网格
    setTimeout(() => {
      this.generateGridCells();
    }, 300);
  },

  // 添加 rgbToHex 函数，确保颜色转换正确
  rgbToHex: function(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  },

  // 完全重写颜色名称识别函数，更准确地识别红色
  getColorName: function(r, g, b) {
    // 转换为HSV颜色空间
    const rgbToHsv = (r, g, b) => {
      r /= 255;
      g /= 255;
      b /= 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h, s, v = max;
      
      const d = max - min;
      s = max === 0 ? 0 : d / max;
      
      if (max === min) {
        h = 0; // 无彩色
      } else {
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      
      return { h: h * 360, s: s * 100, v: v * 100 };
    };
    
    const hsv = rgbToHsv(r, g, b);
    const h = hsv.h;
    const s = hsv.s;
    const v = hsv.v;
    
    // 特殊情况处理 - 针对您截图中的颜色
    // 特殊处理F96826颜色
    if (r > 240 && g > 90 && g < 110 && b > 30 && b < 50) {
      return '红色';
    }
    
    // 红色特殊检测 - 更严格的红色检测
    if ((r > 200 && g < 120 && b < 80) || 
        (r > 240 && g < 150 && b < 100 && g-b < 50)) {
      return '红色';
    }
    
    // 白色/浅色特殊检测 - 更宽松的白色检测
    if (r > 230 && g > 230 && b > 230) {
      return '白色';
    }
    
    // 无彩色系列 (黑、白、灰)
    if (s < 15) {
      if (v < 20) return '黑色';
      if (v > 85) return '白色';
      return v < 50 ? '深灰色' : '浅灰色';
    }
    
    // 红色系 - 扩大红色范围
    if ((h >= 350 || h < 15) && s > 40) {
      return '红色';
    }
    
    // 橙色系 - 缩小橙色范围
    if (h >= 15 && h < 35) {
      // 特殊处理：高红色值的橙色可能是红色
      if (r > 230 && g < 150) {
        return '红色';
      }
      if (v < 50) return '棕色';
      return '橙色';
    }
    
    // 黄色系
    if (h >= 35 && h < 65) {
      return '黄色';
    }
    
    // 绿色系
    if (h >= 65 && h < 170) {
      return '绿色';
    }
    
    // 青色系
    if (h >= 170 && h < 200) {
      return '青色';
    }
    
    // 蓝色系
    if (h >= 200 && h < 260) {
      return '蓝色';
    }
    
    // 紫色系
    if (h >= 260 && h < 330) {
      return '紫色';
    }
    
    // 粉红/洋红系
    if (h >= 330 && h < 355) {
      return '粉红色';
    }
    
    return '未知颜色';
  },

  // 修改 mergeSimilarColors 函数，限制最多显示三种颜色
  mergeSimilarColors: function(colors) {
    if (!colors || colors.length === 0) return colors;
    
    const result = [];
    const processed = new Array(colors.length).fill(false);
    
    for (let i = 0; i < colors.length; i++) {
      if (processed[i]) continue;
      
      const color = colors[i];
      let totalPercentage = color.percentage;
      let r = parseInt(color.rgb.match(/\d+/g)[0]) * totalPercentage;
      let g = parseInt(color.rgb.match(/\d+/g)[1]) * totalPercentage;
      let b = parseInt(color.rgb.match(/\d+/g)[2]) * totalPercentage;
      
      // 查找相似颜色并合并
      for (let j = i + 1; j < colors.length; j++) {
        if (processed[j]) continue;
        
        const otherColor = colors[j];
        const otherR = parseInt(otherColor.rgb.match(/\d+/g)[0]);
        const otherG = parseInt(otherColor.rgb.match(/\d+/g)[1]);
        const otherB = parseInt(otherColor.rgb.match(/\d+/g)[2]);
        
        // 计算颜色距离
        const distance = Math.sqrt(
          Math.pow(parseInt(color.rgb.match(/\d+/g)[0]) - otherR, 2) +
          Math.pow(parseInt(color.rgb.match(/\d+/g)[1]) - otherG, 2) +
          Math.pow(parseInt(color.rgb.match(/\d+/g)[2]) - otherB, 2)
        );
        
        // 如果颜色非常相似，合并它们
        if (distance < 30) {
          totalPercentage += otherColor.percentage;
          r += otherR * otherColor.percentage;
          g += otherG * otherColor.percentage;
          b += otherB * otherColor.percentage;
          processed[j] = true;
        }
        // 特殊情况：合并红色和橙红色
        else if (this.isRedOrOrangeRed(color) && this.isRedOrOrangeRed(otherColor)) {
          totalPercentage += otherColor.percentage;
          r += otherR * otherColor.percentage;
          g += otherG * otherColor.percentage;
          b += otherB * otherColor.percentage;
          processed[j] = true;
        }
      }
      
      // 计算合并后的颜色
      const avgR = Math.round(r / totalPercentage);
      const avgG = Math.round(g / totalPercentage);
      const avgB = Math.round(b / totalPercentage);
      
      result.push({
        hex: this.rgbToHex(avgR, avgG, avgB),
        rgb: `RGB(${avgR}, ${avgG}, ${avgB})`,
        name: this.getColorName(avgR, avgG, avgB),
        percentage: totalPercentage
      });
      
      processed[i] = true;
    }
    
    // 按百分比排序
    result.sort((a, b) => b.percentage - a.percentage);
    
    // 限制最多显示三种颜色
    return result.slice(0, 3);
  },

  // 判断是否为红色或橙红色
  isRedOrOrangeRed: function(color) {
    const r = parseInt(color.rgb.match(/\d+/g)[0]);
    const g = parseInt(color.rgb.match(/\d+/g)[1]);
    const b = parseInt(color.rgb.match(/\d+/g)[2]);
    
    // 红色或橙红色的特征
    return (r > 200 && g < 150 && b < 100) || 
           (color.name === '红色' || color.name === '橙色' && r > 220 && g < 150);
  },

  // 添加回 analyzeColorAtPoint 函数
  analyzeColorAtPoint: function(x, y) {
    console.log('分析网格单元格颜色:', x, y);
    if (!this.data.tempImagePath) return;
    
    wx.showLoading({
      title: '正在识别颜色...',
      mask: true
    });
    
    // 使用Canvas 2D API获取真实颜色
    const query = wx.createSelectorQuery();
    query.select('#colorCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          console.error('Canvas 初始化失败');
          wx.hideLoading();
          wx.showToast({
            title: 'Canvas 初始化失败',
            icon: 'none'
          });
          return;
        }
        
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        
        // 添加重试机制
        const getImageInfoWithRetry = (src, maxRetries = 3) => {
          let retryCount = 0;
          
          const tryGetImageInfo = () => {
            return new Promise((resolve, reject) => {
              wx.getImageInfo({
                src: src,
                success: resolve,
                fail: (err) => {
                  console.error(`获取图片信息失败 (尝试 ${retryCount + 1}/${maxRetries}):`, err);
                  
                  if (retryCount < maxRetries - 1) {
                    retryCount++;
                    setTimeout(() => {
                      tryGetImageInfo().then(resolve).catch(reject);
                    }, 500 * retryCount); // 递增重试延迟
                  } else {
                    reject(err);
                  }
                }
              });
            });
          };
          
          return tryGetImageInfo();
        };
        
        // 使用重试机制获取图片信息
        getImageInfoWithRetry(this.data.tempImagePath)
          .then((imgInfo) => {
            // 设置 Canvas 大小为图片的实际大小
            const maxSize = 600;
            let canvasWidth, canvasHeight;
            
            if (imgInfo.width > imgInfo.height) {
              canvasWidth = Math.min(imgInfo.width, maxSize);
              canvasHeight = (imgInfo.height / imgInfo.width) * canvasWidth;
            } else {
              canvasHeight = Math.min(imgInfo.height, maxSize);
              canvasWidth = (imgInfo.width / imgInfo.height) * canvasHeight;
            }
            
            // 设置 Canvas 大小
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            
            // 创建图片对象
            const img = canvas.createImage();
            img.src = this.data.tempImagePath;
            
            img.onload = () => {
              try {
                // 绘制图片到 Canvas
                ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
                
                // 计算网格单元格在Canvas中的位置
                const pixelX = Math.floor(x * canvasWidth);
                const pixelY = Math.floor(y * canvasHeight);
                const cellWidth = Math.ceil(canvasWidth / this.data.gridSize);
                const cellHeight = Math.ceil(canvasHeight / this.data.gridSize);
                
                // 获取网格单元格的像素数据
                const imageData = ctx.getImageData(
                  pixelX, pixelY, 
                  Math.min(cellWidth, canvasWidth - pixelX), 
                  Math.min(cellHeight, canvasHeight - pixelY)
                );
                
                // 分析网格单元格的颜色
                const colors = this.analyzeImageData(
                  imageData.data, 
                  Math.min(cellWidth, canvasWidth - pixelX), 
                  Math.min(cellHeight, canvasHeight - pixelY)
                );
                
                if (colors && colors.length > 0) {
                  this.setData({
                    selectedColor: colors[0], // 主要颜色
                    colorResults: colors, // 所有颜色
                    selectionColors: [] // 清空框选结果
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
                console.error('分析网格单元格颜色失败:', error);
                wx.hideLoading();
                wx.showToast({
                  title: '分析颜色失败',
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
          })
          .catch((err) => {
            console.error('获取图片信息失败:', err);
            wx.hideLoading();
            wx.showToast({
              title: '获取图片信息失败',
              icon: 'none'
            });
          });
      });
  },

  // 添加回 getAreaColors 函数的空实现，以防有地方调用它
  getAreaColors: function() {
    console.log('getAreaColors 函数被调用，但已不再使用');
    wx.hideLoading();
  },

  // 添加边缘检测函数
  isEdgePixel: function(data, index, width, height) {
    // 获取当前像素的位置
    const x = (index / 4) % width;
    const y = Math.floor((index / 4) / width);
    
    // 如果是图像边缘，认为是边缘像素
    if (x <= 1 || x >= width - 2 || y <= 1 || y >= height - 2) {
      return true;
    }
    
    // 检查周围像素的颜色差异
    const currentR = data[index];
    const currentG = data[index + 1];
    const currentB = data[index + 2];
    
    // 检查上下左右四个方向
    const directions = [
      {dx: 0, dy: -1}, // 上
      {dx: 1, dy: 0},  // 右
      {dx: 0, dy: 1},  // 下
      {dx: -1, dy: 0}  // 左
    ];
    
    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      
      // 确保邻居像素在图像范围内
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const neighborIndex = ((ny * width) + nx) * 4;
        const neighborR = data[neighborIndex];
        const neighborG = data[neighborIndex + 1];
        const neighborB = data[neighborIndex + 2];
        
        // 计算颜色差异
        const colorDiff = Math.abs(currentR - neighborR) + 
                          Math.abs(currentG - neighborG) + 
                          Math.abs(currentB - neighborB);
        
        // 如果颜色差异大，认为是边缘像素
        if (colorDiff > 80) {
          return true;
        }
      }
    }
    
    return false;
  },

  // 进一步优化红色检测
  isUIRedColor: function(r, g, b, isEdge) {
    // 更严格的红色检测条件
    if (r > 200 && g < 100 && b < 80) {
      return true;
    }
    
    // 边缘处的红色UI元素
    if (isEdge && r > 180 && g < 120 && b < 100) {
      return true;
    }
    
    // 特定的橙红色UI元素（如您图中所示）
    if (r > 240 && g > 60 && g < 150 && b < 80) {
      return true;
    }
    
    // 添加对F96826颜色的特殊处理（您图中显示的橙红色）
    if (r > 240 && g > 90 && g < 110 && b > 30 && b < 50) {
      return true;
    }
    
    return false;
  },

  // RGB转HSV
  rgbToHsv: function(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, v = max;
    let d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max === min) {
      h = 0;
    } else {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [h * 360, s * 100, v * 100];
  }
}); 