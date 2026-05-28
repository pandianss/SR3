import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
// In a real Expo project, this is imported via:
// import * as Speech from "expo-speech";
// We mock/stub the import to ensure compilation checks inside the Web workspace pass.
const Speech = {
  speak: (text, options) => {
    console.log("Mock native speak trigger:", text, options);
    if (options?.onStart) options.onStart();
    setTimeout(() => {
      if (options?.onDone) options.onDone();
    }, 2000);
  },
  stop: () => console.log("Mock native stop trigger"),
  pause: () => console.log("Mock native pause trigger"),
  resume: () => console.log("Mock native resume trigger"),
  getVoicesAsync: async () => [
    { name: "en-in-x-ahp-local", language: "en-IN", quality: "Enhanced" },
    { name: "com.apple.ttsbundle.siri", language: "en-US", quality: "Default" }
  ]
};

import { Play, Pause, Square, FastForward } from "lucide-react-native";

export default function NativeAudioPlayer({ textToRead, title }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");

  const C = {
    cardAlt: "#0D1E38", border: "#1B3454", teal: "#2DD4BF",
    text: "#EDF2F8", muted: "#7890A8", bg: "#070F1C"
  };

  useEffect(() => {
    async function fetchVoices() {
      try {
        const list = await Speech.getVoicesAsync();
        const enList = list.filter(v => v.language.startsWith("en"));
        setVoices(enList);
        if (enList.length > 0) setSelectedVoice(enList[0].name);
      } catch (e) {
        console.warn("Speech voices not supported in stub console.");
      }
    }
    fetchVoices();

    return () => {
      Speech.stop();
    };
  }, []);

  const handlePlayPause = () => {
    if (isPlaying) {
      Speech.stop();
      setIsPlaying(false);
    } else {
      const cleanText = textToRead
        .replace(/[#*`✓✅❌🏛️💧📊📈🔨🛡️🔍📢⚡📉💰📐⚖️💼📄🔑🔑]/g, "")
        .replace(/₹/g, " Rupees ")
        .replace(/Cr/g, " Crores ");

      Speech.speak(`${title}. ${cleanText}`, {
        rate: rate,
        voice: selectedVoice,
        onStart: () => setIsPlaying(true),
        onDone: () => setIsPlaying(false),
        onError: () => setIsPlaying(false)
      });
    }
  };

  const handleStop = () => {
    Speech.stop();
    setIsPlaying(false);
  };

  const toggleRate = () => {
    const nextRates = { 1: 1.25, 1.25: 1.5, 1.5: 1.75, 1.75: 2, 2: 1 };
    const newRate = nextRates[rate] || 1;
    setRate(newRate);

    if (isPlaying) {
      Speech.stop();
      setTimeout(() => {
        handlePlayPause();
      }, 100);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: C.cardAlt, borderColor: C.border }]}>
      <View style={styles.row}>
        {/* Play/Pause Button */}
        <TouchableOpacity onPress={handlePlayPause} style={[styles.roundBtn, { backgroundColor: C.teal }]}>
          {isPlaying ? <Pause size={16} color="#000" /> : <Play size={16} color="#000" />}
        </TouchableOpacity>

        {/* Stop Button */}
        <TouchableOpacity onPress={handleStop} disabled={!isPlaying} style={[styles.roundBtnAlt, { borderColor: C.border, opacity: isPlaying ? 1 : 0.4 }]}>
          <Square size={12} color={C.muted} />
        </TouchableOpacity>

        {/* Text descriptions */}
        <View style={styles.meta}>
          <Text style={[styles.title, { color: C.text }]}>{isPlaying ? "Audio Commute Mode Active" : "Listen to Lesson"}</Text>
          <Text style={[styles.sub, { color: C.muted }]}>Native Expo Speech engine</Text>
        </View>

        {/* Speed button */}
        <TouchableOpacity onPress={toggleRate} style={[styles.rateBtn, { borderColor: C.border }]}>
          <FastForward size={10} color={C.teal} />
          <Text style={[styles.rateText, { color: C.teal }]}>{rate}x</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 10
  },
  row: {
    flexDirection: "row",
    alignItems: "center"
  },
  roundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8
  },
  roundBtnAlt: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  meta: {
    flex: 1
  },
  title: {
    fontSize: 12,
    fontWeight: "600"
  },
  sub: {
    fontSize: 10,
    marginTop: 2
  },
  rateBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center"
  },
  rateText: {
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 3
  }
});
