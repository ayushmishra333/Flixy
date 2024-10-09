import { View, FlatList, TouchableOpacity, Image, Alert } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import SearchInput from '../../components/SearchInput'
import EmptyState from '../../components/EmptyState'
import VideoCard from '../../components/VideoCard'
import { getUserPosts, searchPosts, signOut, requestAccountDeletion} from '../../lib/appwrite'
import useAppwrite from '../../lib/useAppwrite'
import { useGlobalContext } from '../../context/GlobalProvider'
import { icons } from '../../constants'
import InfoBox from '../../components/InfoBox'
import { router } from 'expo-router'

const Profile = () => {
  const { user, setUser, setIsLogged } = useGlobalContext();
  const { data: posts } = useAppwrite(() => getUserPosts(user.$id));

  // Handle Logout
  const logout = async () => {
    await signOut();
    setUser(null);
    setIsLogged(false);

    router.replace("/sign-in");
  };

// Handle Account Deletion
const handleDeleteAccount = async () => {
  // Show confirmation alert before deleting
  Alert.alert(
    "Delete Account",
    "Are you sure you want to delete your account? This action cannot be undone.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            // Inform the user that an email has been drafted and they need to send it
            Alert.alert(
              "Send Account Deletion Email",
              "Your account deletion request email has been drafted. Please tap 'Send Email' to open the email app and send the request.",
              [
                {
                  text: "Send Email",
                  onPress: () => {
                    // This will trigger the MailComposer defined in appwrite.js
                    requestAccountDeletion(user);

                    // Only after the user taps Send Email, we show the logout alert
                    Alert.alert(
                      "Logout Confirmation",
                      "After sending the email, you'll be logged out. Confirm to proceed.",
                      [
                        {
                          text: "Confirm Logout",
                          onPress: () => {
                            // Log the user out after the email is sent
                            setUser(null);
                            setIsLogged(false);
                            router.replace("/sign-in");
                          },
                        },
                        { text: "Cancel", style: "cancel" },
                      ]
                    );
                  },
                },
                { text: "Cancel", style: "cancel" },
              ]
            );
          } catch (error) {
            console.error("Failed to process account deletion request:", error);
            Alert.alert("Error", "Failed to submit deletion request. Please try again.");
          }
        },
      },
    ]
  );
};

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
        data={posts}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <><VideoCard video={item} /></>
        )}

        ListHeaderComponent={() => (
          <View className="w-full flex justify-center items-center mt-6 mb-12 px-4">

            {/* Logout and Delete Buttons - Aligned and Equal Sized */}
            <View className="flex w-full flex-row justify-end space-x-4 mb-10">
              <TouchableOpacity
                onPress={logout}
                className="w-8 h-8 flex items-center justify-center"
              >
                <Image
                  source={icons.logout}
                  resizeMode="contain"
                  className="w-6 h-6"
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeleteAccount}
                className="w-8 h-8 flex items-center justify-center"
              >
                <Image
                  source={icons.trash}  // Assuming you have an icon for delete/trash
                  resizeMode="contain"
                  className="w-8 h-8"
                />
              </TouchableOpacity>
            </View>

            {/* User Avatar */}
            <View className="w-16 h-16 border border-secondary rounded-lg flex justify-center items-center">
              <Image
                source={{ uri: user?.avatar }}
                className="w-[90%] h-[90%] rounded-lg"
                resizeMode="cover"
              />
            </View>

            <InfoBox
              title={user?.username}
              containerStyles="mt-5"
              titleStyles="text-lg"
            />

            <View className="mt-5 flex flex-row">
              <InfoBox
                title={posts.length || 0}
                subtitle="Posts"
                titleStyles="text-xl"
                containerStyles="mr-10"
              />
              <InfoBox
                title="1.2k"
                subtitle="Followers"
                titleStyles="text-xl"
              />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

export default Profile;