import { displayLocale } from '../../utils/localizedDisplay';
import { copy, useCopyUpdates } from '../../i18n/copy';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenWrapper from '../../components/ScreenWrapper';
import Button from '../../components/Button';
import { BackArrowIcon, PawIcon } from '../../assets';

export default function ScanMapDetailScreen({ route, navigation }) {
  useCopyUpdates();
  const { scan } = route.params || {};
  const insets = useSafeAreaInsets();

  if (!scan) {
    return (
      <ScreenWrapper noBottomTabs>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <BackArrowIcon width={20} height={20} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{copy("Scan Details")}</Text>
            </View>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.noMapContainer}>
            <Text style={styles.noMapText}>{copy("Scan data not available")}</Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  const handleBack = () => {
    navigation.goBack();
  };

  const handleViewDirections = () => {
    if (!scan.latitude || !scan.longitude) {
      return;
    }
    
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${scan.latitude},${scan.longitude}`;
    const label = copy('Scan Location');
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    Linking.openURL(url);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString(displayLocale(), options);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const options = { hour: 'numeric', minute: '2-digit', hour12: true };
    return date.toLocaleTimeString(displayLocale(), options);
  };

  const petName = scan.pet?.name || copy('Unknown Pet');
  const petBreed = scan.pet?.breed || scan.pet?.type || copy('Unknown Breed');
  const ownerName = scan.pet?.user?.fullName || copy('Unknown Owner');
  const petImage = scan.pet?.photoUrl;

  // Age / weight, formatted the same way as PetDetailScreen and
  // MyPetProfileScreen so the wording is consistent wherever a pet is shown.
  const getAgeDisplay = () => {
    const years = scan.pet?.ageYears || 0;
    const months = scan.pet?.ageMonths || 0;
    if (years === 0 && months === 0) return copy('Age not specified');
    const yearText = years === 1 ? copy('1 year') : copy('{{count}} years', {count: years});
    const monthText = months === 1 ? copy('1 month') : copy('{{count}} months', {count: months});
    const age = years && months ? copy('{{years}} and {{months}}', {years: yearText, months: monthText}) : years ? yearText : monthText;
    return copy('{{age}} old', {age});
  };
  const getWeightDisplay = () =>
    scan.pet?.weight ? copy('{{weight}} lbs', {weight:scan.pet.weight}) : copy('Weight not specified');
  const scanDate = scan.scannedAt ? formatDate(scan.scannedAt) : scan.date || '';
  const scanTime = scan.scannedAt ? formatTime(scan.scannedAt) : scan.time || '';
  const scanTitle = scan.pet?.name ? copy('{{name}} Scanned', {name:scan.pet.name}) : scan.title || copy('Tag Scanned');

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon width={20} height={20} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{scanTitle}</Text>
            <Text style={styles.headerSubtitle}>
              {scanDate}  |  {scanTime}
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Map */}
        {scan.latitude && scan.longitude ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: scan.latitude,
              longitude: scan.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: scan.latitude,
                longitude: scan.longitude,
              }}
              title={scanTitle}
              description={`${scanDate} | ${scanTime}`}
            />
          </MapView>
        ) : (
          <View style={styles.noMapContainer}>
            <Text style={styles.noMapText}>{copy("Location not available")}</Text>
          </View>
        )}

        {/* Floating Bottom Content */}
        <View style={[styles.floatingContent, { bottom: insets.bottom }]}>
          {/* Pet Details Card */}
          <View style={styles.petCard}>
            <View style={styles.petInfo}>
              <Text style={styles.petName}>{petName}</Text>
              <View style={styles.breedRow}>
                <PawIcon width={14} height={14} fill="#32A6D8" />
                <Text style={styles.breedText}>{petBreed}</Text>
              </View>
              <Text style={styles.detailsText}>
                <Text style={styles.detailLabel}>{copy("Weight:")}</Text>
                <Text style={styles.detailValue}> {getWeightDisplay()}</Text>
                <Text style={styles.detailValue}>  ·  </Text>
                <Text style={styles.detailLabel}>{copy("Age:")}</Text>
                <Text style={styles.detailValue}> {getAgeDisplay()}</Text>
              </Text>
              <Text style={styles.ownerText}>{copy("Owner:") + " "}{ownerName}</Text>
            </View>
            <View style={styles.petImageContainer}>
              <Image 
                source={petImage ? { uri: petImage } : require('../../assets/images/Pet_default_image.png')} 
                style={styles.petImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* View Directions Button */}
          {scan.latitude && scan.longitude && (
            <View style={styles.buttonContainer}>
              <Button
                title={copy("View Directions")}
                onPress={handleViewDirections}
                size='small'
              />
            </View>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    color: '#32A6D8',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
  },
  headerSubtitle: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  placeholder: {
    width: 40,
  },
  map: {
    flex: 1,
  },
  floatingContent: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  petCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 24,
    marginBottom: 12,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  petInfo: {
    flex: 1,
    gap: 5,
  },
  petName: {
    color: '#32A6D8',
    fontSize: 17,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 22,
  },
  breedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breedText: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  detailsText: {
    marginTop: 2,
  },
  detailLabel: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  detailValue: {
    color: '#080E1E',
    fontSize: 12,
    fontFamily: 'Avenir LT Std',
    fontWeight: '600',
    lineHeight: 18.6,
  },
  ownerText: {
    color: '#080E1E',
    fontSize: 17,
    fontFamily: 'Outfit',
    fontWeight: '500',
    lineHeight: 22,
  },
  petImageContainer: {
    width: 85,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 16,
  },
  noMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  noMapText: {
    color: '#818898',
    fontSize: 16,
    fontFamily: 'Avenir LT Std',
    fontWeight: '400',
  },
});

