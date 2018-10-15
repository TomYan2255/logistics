import { Alert } from 'react-native';
import { Toast } from 'native-base';
class AlertHelper {
    alertObj = Alert; // 開放alert物件提供個畫面自定義使用
    toastObj = Toast;
    alertError(message: string) {
        Alert.alert(
            'Alert Message',
            message,
            [{ text: 'OK' }],
            { cancelable: false }
        )
    }

    displayToast(message: string) {
        Toast.show({
            text: message,
            position: 'bottom',
            duration: 3000
        });
    }
}

export default new AlertHelper();