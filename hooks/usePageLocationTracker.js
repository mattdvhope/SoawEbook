import { useEffect, useLayoutEffect, useRef } from 'react';

// Custom hook to track and store page location robustly
const usePageLocationTracker = (getCurrentLocation, storeCurrentCfi, isReaderReadyState) => {
  const lastStoredCfi = useRef(null); // Tracks the last stored CFI to avoid duplicate saves
  const isTracking = useRef(false); // Controls tracking state
  const trackingId = useRef(null); // Stores requestAnimationFrame ID for cleanup

  // Manage the tracking state based on reader readiness
  useEffect(() => {
    if (isReaderReadyState) {
      isTracking.current = true;
      console.log("Reader is ready. Starting location tracking...");
    } else {
      console.log("Reader is not ready. Stopping location tracking...");
      isTracking.current = false;
    }
  }, [isReaderReadyState]);

  // Location tracking function, designed to avoid an infinite loop
  useLayoutEffect(() => {
    const trackLocation = async () => {
      if (!isTracking.current) return; // Exit if tracking is not enabled

      try {
        console.log("Attempting to retrieve current location...");
        const location = await getCurrentLocation();

        if (location && location.start && location.start.cfi) {
          const currentCfi = location.start.cfi;
          console.log("Current CFI retrieved:", currentCfi);

          // Store the new CFI if it's different from the last stored one
          if (lastStoredCfi.current !== currentCfi) {
            console.log("New CFI detected. Attempting to store...");
            try {
              await storeCurrentCfi(currentCfi);
              lastStoredCfi.current = currentCfi; // Update last stored CFI reference
              console.log("New CFI stored successfully:", currentCfi);
            } catch (storeError) {
              console.error("Error storing current CFI:", storeError);
            }
          } else {
            console.log("CFI has not changed. No storage required.");
          }
        } else {
          console.log("Location data is incomplete or unavailable.");
        }
      } catch (locationError) {
        console.error("Error getting current location:", locationError);
      }

      // Schedule the next tracking check only if still tracking
      if (isTracking.current) {
        trackingId.current = requestAnimationFrame(trackLocation);
      }
    };

    // Start tracking if the reader is ready
    if (isTracking.current) {
      console.log("Initiating location tracking...");
      trackingId.current = requestAnimationFrame(trackLocation);
    }

    // Cleanup function to stop tracking
    return () => {
      if (trackingId.current) {
        cancelAnimationFrame(trackingId.current);
        console.log("Cleaning up and stopping location tracking...");
      }
      isTracking.current = false;
    };
  }, [getCurrentLocation, storeCurrentCfi]);

  useEffect(() => {
    console.log("isReaderReadyState changed:", isReaderReadyState);
  }, [isReaderReadyState]);
};

export default usePageLocationTracker;
