import React, { useState } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import ColorPicker from './ColorPicker';

const App = () => {
  const [imageUri, setImageUri] = useState(null);

  // 从图库选择图片
  const selectImage = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('用户取消了选择图片');
      } else if (response.error) {
        console.log('选择图片出错: ', response.error);
      } else {
        setImageUri(response.uri || response.assets[0].uri);
      }
    });
  };

  // 使用相机拍照
  const takePhoto = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      saveToPhotos: true,
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('用户取消了拍照');
      } else if (response.error) {
        console.log('拍照出错: ', response.error);
      } else {
        setImageUri(response.uri || response.assets[0].uri);
      }
    });
  };

  return (
    <View style={styles.container}>
      {!imageUri ? (
        <View style={styles.buttonContainer}>
          <Button title="从相册选择图片" onPress={selectImage} />
          <View style={styles.buttonSpacer} />
          <Button title="拍照" onPress={takePhoto} />
        </View>
      ) : (
        <ColorPicker imageUri={imageUri} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  buttonSpacer: {
    height: 20,
  },
});

export default App; 