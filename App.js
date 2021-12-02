import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Button, Platform } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { LocationGeofencingEventType } from 'expo-location';
import * as Notifications from 'expo-notifications';



const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    // Error occurred - check `error.message` for more details.
    return;
  }
  if (data) {
    const { locations } = data;
    // console.log('locations => ', locations);
    // do something with the locations captured in the background
  }
});

TaskManager.defineTask('GEOCERCA_TASK_CONSULTAS', ({ data: { eventType, region }, error }) => {
  if (error) {
      // check `error.message` for more details.
      return;
  }
  if (eventType === LocationGeofencingEventType.Enter) {
      schedulePushNotification('Inside GeoFence')
  } else if (eventType === LocationGeofencingEventType.Exit) {
      schedulePushNotification('Outside GeoFence');
  }
});


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});


// const PermissionsButton = () => (
//   <TouchableOpacity onPress={requestPermissions}>
//     <Text>Enable background  button</Text>
//   </TouchableOpacity>
//   <Button
//     title="Start GeoFence"
//     onPress={requestPermissions}
//   />
// );

export default function App() {

  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();
  const [ locationPermisos, setLocationPermisos ] = useState(null);
  const [ appStatus, setAppStatus ] = useState('init');
  const [location, setLocation] = useState(null);
  // const [ latitude, setlatitude ] = useState(null);
  // const [ logitude, setLongitude ] = useState(null);

  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (
      lastNotificationResponse &&
      lastNotificationResponse.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      // navigate to your desired screen
      setNotification(lastNotificationResponse.notification);
    }
  }, [lastNotificationResponse]);
  
  useEffect(() => {
    // setAppStatus('Entro en useEffect de permisos');
    (async () => {
      // setAppStatus('Entro en useEffect async de permisos');
      // const { status } = await Location.requestBackgroundPermissionsAsync();
      // setAppStatus('Paso requestBackgroundPermissionsAsync');
      // setLocationPermisos(status);


      // if (status === 'granted') {

      //   let locationResponse = await Location.getCurrentPositionAsync({});
      //   console.log('location 1 ', locationResponse);
      //   setLocation(location);

      //   const latitude = locationResponse.coords.latitude;
      //   const longitude = locationResponse.coords.longitude;

      //   const region = {identifier: '1', latitude: latitude, longitude: longitude, radius: 100};

      //   Location.startGeofencingAsync('GEOCERCA_TASK_CONSULTAS', [region]);

      // }
  })();

    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      setNotification(response.notification);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  
  }, []);


  const requestPermissions = async () => {
      setAppStatus('Entro en funcion async de permisos');
      const { status } = await Location.requestBackgroundPermissionsAsync();
      setAppStatus('Paso requestBackgroundPermissionsAsync');
      setLocationPermisos(status);


      if (status === 'granted') {

        let locationResponse = await Location.getCurrentPositionAsync({});
        // console.log('location 1 ', locationResponse);
        setLocation(locationResponse);

        const latitude = locationResponse.coords.latitude;
        const longitude = locationResponse.coords.longitude;
        // console.log(' latitude: ', latitude, ' longitude: ', longitude);
        const region = {identifier: '1', latitude: latitude, longitude: longitude, radius: 100};

        Location.startGeofencingAsync('GEOCERCA_TASK_CONSULTAS', [region]);

      }
    }

  return (
      <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-around',
      }}> 
      <Text>Location</Text>
            {
        location != null &&
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Text>Latitude: {location.coords.latitude}</Text>
          <Text>Longitude: {location.coords.longitude}</Text>
        </View>
        
      }
              <Button
                title="Start GeoFence"
                onPress={requestPermissions}
              />
      <StatusBar style="auto" />
      <Text>App status: {appStatus}</Text>
      <Text>Your expo push token: {expoPushToken}</Text>
      <Text>Location permisos: {locationPermisos}</Text>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text>Title: {notification && notification.request.content.title} </Text>
        <Text>Body: {notification && notification.request.content.body}</Text>
        <Text>Data: {notification && JSON.stringify(notification.request.content.data)}</Text>
      </View>
      <Button
        title="Press to schedule a notification"
        onPress={async () => {
          await schedulePushNotification('Test para geoFence');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

async function schedulePushNotification(message) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "You've got mail! 📬",
      body: message,
      data: { type: 'asistencia' },
    },
    trigger: { seconds: 1 },
  });
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    // console.log(token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}