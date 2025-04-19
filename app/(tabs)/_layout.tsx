import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          href: '/',
        }}
      />
      <Tabs.Screen
        name="drinks"
        options={{
          title: 'Drinks',
          href: '/drinks',
        }}
      />
      <Tabs.Screen
        name="bars"
        options={{
          title: 'Bars',
          href: '/bars',
        }}
      />
      <Tabs.Screen
        name="food"
        options={{
          title: 'Food',
          href: '/food',
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: 'Games',
          href: '/games',
        }}
      />
    </Tabs>
  );
}