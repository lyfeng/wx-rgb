// 导入必要的库
import React, { useState, useRef, useEffect } from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';

const ColorPicker = ({ imageUri }) => {
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectionMode, setSelectionMode] = useState('point'); // 'point' 或 'area'
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const imageRef = useRef(null);
  
  // 处理图片点击，获取点击位置的颜色
  const handleImagePress = (event) => {
    if (!imageRef.current) return;
    
    const { locationX, locationY } = event.nativeEvent;
    
    if (selectionMode === 'point') {
      // 点选模式，直接获取该点颜色
      getColorAtPoint(locationX, locationY);
    } else if (selectionMode === 'area' && !selectionStart) {
      // 框选模式，记录起始点
      setSelectionStart({ x: locationX, y: locationY });
    } else if (selectionMode === 'area' && selectionStart) {
      // 框选模式，记录结束点并获取区域平均颜色
      setSelectionEnd({ x: locationX, y: locationY });
      getColorInArea(selectionStart, { x: locationX, y: locationY });
    }
  };
  
  // 获取指定点的颜色（这里需要使用原生模块来实现）
  const getColorAtPoint = async (x, y) => {
    try {
      // 这里需要调用原生模块来获取图片上指定点的颜色
      // 示例代码，实际实现需要原生模块支持
      const color = await NativeModules.ImageColorPicker.getColorAtPoint(imageUri, x, y);
      setSelectedColor(color);
    } catch (error) {
      console.error('获取颜色失败:', error);
    }
  };
  
  // 获取指定区域的平均颜色
  const getColorInArea = async (start, end) => {
    try {
      // 这里需要调用原生模块来获取图片上指定区域的平均颜色
      // 示例代码，实际实现需要原生模块支持
      const color = await NativeModules.ImageColorPicker.getColorInArea(
        imageUri, 
        start.x, 
        start.y, 
        end.x, 
        end.y
      );
      setSelectedColor(color);
      // 重置选择区域
      setSelectionStart(null);
      setSelectionEnd(null);
    } catch (error) {
      console.error('获取区域颜色失败:', error);
    }
  };
  
  // 切换选择模式
  const toggleSelectionMode = () => {
    setSelectionMode(selectionMode === 'point' ? 'area' : 'point');
    setSelectionStart(null);
    setSelectionEnd(null);
  };
  
  // 渲染选择区域
  const renderSelectionArea = () => {
    if (!selectionStart) return null;
    
    const width = selectionEnd ? Math.abs(selectionEnd.x - selectionStart.x) : 0;
    const height = selectionEnd ? Math.abs(selectionEnd.y - selectionStart.y) : 0;
    const left = selectionEnd ? Math.min(selectionStart.x, selectionEnd.x) : selectionStart.x;
    const top = selectionEnd ? Math.min(selectionStart.y, selectionEnd.y) : selectionStart.y;
    
    return (
      <View
        style={{
          position: 'absolute',
          left,
          top,
          width,
          height,
          borderWidth: 2,
          borderColor: 'white',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
        }}
      />
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <TouchableOpacity activeOpacity={1} onPress={handleImagePress}>
          <Image
            ref={imageRef}
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
          />
          {selectionMode === 'area' && renderSelectionArea()}
        </TouchableOpacity>
      </View>
      
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.modeButton} 
          onPress={toggleSelectionMode}
        >
          <Text style={styles.buttonText}>
            {selectionMode === 'point' ? '点选模式' : '框选模式'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {selectedColor && (
        <View style={styles.colorInfoContainer}>
          <View 
            style={[
              styles.colorPreview, 
              { backgroundColor: `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})` }
            ]} 
          />
          <View style={styles.colorTextContainer}>
            <Text style={styles.colorText}>RGB: {selectedColor.r}, {selectedColor.g}, {selectedColor.b}</Text>
            <Text style={styles.colorText}>HEX: #{selectedColor.hex}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
  },
  modeButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  colorInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  colorPreview: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  colorTextContainer: {
    flex: 1,
  },
  colorText: {
    fontSize: 16,
    marginBottom: 5,
  },
});

export default ColorPicker; 