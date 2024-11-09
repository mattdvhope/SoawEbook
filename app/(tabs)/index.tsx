import React, { useState, useEffect } from "react";
import { SafeAreaView, Text, TouchableOpacity, StyleSheet, Modal, View, FlatList } from "react-native";
import { ReaderProvider, Reader, useReader } from "@epubjs-react-native/core";
import { useFileSystem } from "@epubjs-react-native/expo-file-system";
import { Buffer } from 'buffer';
import { LogBox } from "react-native";
import * as SecureStore from "expo-secure-store";
// import { loadEpubFile } from "../../scripts/loadEpubFile";
// import { authenticateUserWithCustomToken } from "../../scripts/authenticateUserWithCustomToken";
// import { initializeFirebase } from "../../firebaseConfig";
import usePageLocationTracker from "../../hooks/usePageLocationTracker";

LogBox.ignoreAllLogs();

const App = () => {
  const [epubUri, setEpubUri] = useState<string | null>(null);
  const [storedCfi, setStoredCfi] = useState<string | null>(null); 
  const [tocData, setTocData] = useState([]); 
  const [isModalVisible, setModalVisible] = useState(false);
  const [goToLocation, setGoToLocation] = useState(null);
  const [bookmarks, setBookmarks] = useState([]); 
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Talha, I've made these a few temporary changes here.
        // You won't have to deal with firebase or 
        // SoawEbook/scripts/loadEpubFile.js or with
        // SoawEbook/scripts/authenticateUserWithCustomToken.js

        // Please leave this commented-out code here.

        // const response = await fetch("https://firebaseconfig.netlify.app/.netlify/functions/firebase-config-object");
        // if (!response.ok) {
        //   throw new Error("Failed to fetch Firebase config");
        // }
        // const result = await response.json();
        // const configString = Buffer.from(result.data, 'base64').toString('utf-8');
        // const config = JSON.parse(configString);

        // const { auth, storage } = initializeFirebase(config);
        // setFirebaseInitialized(true);

        // const { success } = await authenticateUserWithCustomToken(auth);
        // if (!success) throw new Error("User authentication failed");

        // await loadEpubFile(setEpubUri, setStoredCfi, storage);

        // Use these three lines to get the book and last cfi...
        setEpubUri("https://s3.amazonaws.com/moby-dick/OPS/package.opf")
        const lastLocationCfi = await SecureStore.getItemAsync("lastLocationCfi");
        setStoredCfi(lastLocationCfi);

        const storedBookmarks = await SecureStore.getItemAsync("bookmarks");
        setBookmarks(storedBookmarks ? JSON.parse(storedBookmarks) : []);
      } catch (error) {
        console.error("Error during initialization:", error);
      }
    };
    initializeSession();
  }, []);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const handleLinkPress = async (item) => {
    if (goToLocation && item.href) {
      const cleanHref = item.href.startsWith('/') ? item.href.slice(1) : item.href;
      try {
        await goToLocation(cleanHref);
        toggleModal();
      } catch (error) {
        console.error("Failed to navigate to chapter:", error);
      }
    }
  };

  const addBookmark = async () => {
    console.log(currencatio);
    const location = currencatio;
    if (location && location.start && location.start.cfi) {
      const newBookmark = { id: Date.now().toString(), cfi: location.start.cfi };
      const updatedBookmarks = [...bookmarks, newBookmark];
      setBookmarks(updatedBookmarks);
      await SecureStore.setItemAsync("bookmarks", JSON.stringify(updatedBookmarks));
      console.log("Bookmark added:", newBookmark.cfi);
    }
  };

  const goToBookmark = async (cfi) => {
    if (goToLocation && cfi) {
      await goToLocation(cfi);
      toggleModal();
    }
  };

  const removeBookmark = async (id) => {
    const updatedBookmarks = bookmarks.filter((bookmark) => bookmark.id !== id);
    setBookmarks(updatedBookmarks);
    await SecureStore.setItemAsync("bookmarks", JSON.stringify(updatedBookmarks));
    console.log("Bookmark removed:", id);
  };

  // Keep this commented-out code here...
  // if (!firebaseInitialized || !epubUri) {

  if (!epubUri) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Loading "The Book"...</Text>
      </SafeAreaView>
    );
  }

  return (
    <ReaderProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <ReaderComponent
          epubUri={epubUri}
          storedCfi={storedCfi}
          onTocLoad={setTocData}
          setGoToLocation={setGoToLocation}
        />

        {/* TOC & Bookmark Button */}
        <TouchableOpacity style={styles.tocButton} onPress={toggleModal}>
          <Text style={styles.tocButtonText}>≡</Text>
        </TouchableOpacity>

        {/* TOC & Bookmarks Modal */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={toggleModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Table of Contents</Text>
              <FlatList
                data={tocData}
                keyExtractor={(item) => item.href}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.tocItem} onPress={() => handleLinkPress(item)}>
                    <Text style={styles.tocItemText}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              />
              <Text style={styles.modalTitle}>Bookmarks</Text>
              {bookmarks.length > 0 ? (
                <FlatList
                  data={bookmarks}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.bookmarkItem}>
                      <TouchableOpacity onPress={() => goToBookmark(item.cfi)}>
                        <Text style={styles.bookmarkText}>Go to Bookmark</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeBookmark(item.id)}>
                        <Text style={styles.removeText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />
              ) : (
                <Text style={{ textAlign: "center", color: "#aaa", marginTop: 10 }}>
                  No bookmarks available.
                </Text>
              )}
              <TouchableOpacity onPress={() => addBookmark()} style={styles.addBookmarkButton}>
                <Text style={styles.addBookmarkText}>Add Bookmark</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ReaderProvider>
  );
};

const ReaderComponent = ({ epubUri, storedCfi, onTocLoad, setGoToLocation }) => {
  const { toc, goToLocation, getCurrentLocation } = useReader();
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (toc && toc.length > 0) {
      onTocLoad(toc);
    }
  }, [toc, onTocLoad]);

  const handleReady = async () => {
    if (goToLocation) {
      setGoToLocation(() => goToLocation);
      if (storedCfi) {
        console.log("Navigating to stored CFI:", storedCfi);
        await goToLocation(storedCfi);
      }
    }
  };

  const storeCurrentCfi = async (cfi) => {
    try {
      await SecureStore.setItemAsync("lastLocationCfi", cfi);
      console.log("Stored current CFI:", cfi);
    } catch (error) {
      console.error("Error storing current CFI:", error);
    }
  };

  useEffect(() => { // This gives me the destination page
    const location = getCurrentLocation();
    if (location && location.start && location.start.cfi) {
      const destinationCfi = location.start.cfi;
      storeCurrentCfi(destinationCfi);
    }
  }, [triggered]);

  const handleLocationChange = () => {
    setTriggered((prev) => !prev);
  };

  return (
    <Reader
      src={epubUri}
      fileSystem={useFileSystem}
      onLocationChange={handleLocationChange}
      onReady={handleReady}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  tocButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 25,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tocButtonText: { color: "white", fontSize: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    height: "70%",
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: "auto",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  tocItem: { paddingVertical: 10, paddingHorizontal: 15, borderBottomWidth: 1, borderColor: "#ddd" },
  tocItemText: { fontSize: 16 },
  bookmarkItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  bookmarkText: { fontSize: 16, color: "blue" },
  removeText: { fontSize: 16, color: "red" },
  addBookmarkButton: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: "#4CAF50",
    borderRadius: 5,
  },
  addBookmarkText: { color: "white", fontSize: 16, textAlign: "center" },
  closeButton: { marginTop: 20, padding: 10, backgroundColor: "#333", borderRadius: 5 },
  closeButtonText: { color: "white", fontSize: 16, textAlign: "center" },
});

export default App;
