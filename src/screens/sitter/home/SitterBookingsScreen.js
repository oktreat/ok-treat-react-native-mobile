import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import api from '../../../config/api';
import { CLOUDINARY_FOLDERS } from '../../../config/cloudinary';
import { uploadToCloudinary } from '../../../services/cloudinaryService';
import { useState, useEffect, useCallback } from 'react';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { BackArrowIcon, StarIcon, CoinIcon, DogImage, ChatIcon } from '../../../assets';
import Icon from '@expo/vector-icons/Ionicons';
import { getSitterBookings, markBookingCompleted, startSitting } from '../../../services/bookingService';

// Enum → human label for the service type.
const SERVICE_LABELS = {
  BOARDING: 'Boarding',
  HOUSE_SITTING: 'House Sitting',
  DROP_IN_VISITS: 'Drop-In Visit',
  DAY_CARE: 'Day Care',
  PET_WALKING: 'Pet Walking',
};
const humanizeService = (t) => SERVICE_LABELS[t] || t || '';

const careText = (value) => {
  if (value == null || value === '') return 'Not provided';
  if (Array.isArray(value)) return value.map(item => String(item)).filter(Boolean).join(', ') || 'Not provided';
  if (typeof value === 'object') return Object.values(value).map(item => String(item)).filter(Boolean).join(', ') || 'Not provided';
  return String(value);
};


// Helper to derive status style
const getStatusStyle = (status) => {
  switch (status?.toUpperCase()) {
    case 'CONFIRMED':
    case 'UPCOMING':
      return { color: '#DCF5E5', textColor: '#2E9E5B', label: 'Confirmed', category: 'Upcoming' };
    case 'IN_PROGRESS':
    case 'ONGOING':
      return { color: '#DDF4EF', textColor: '#56AA9A', label: 'Ongoing', category: 'Upcoming' };
    case 'COMPLETED':
      return { color: '#ECF5EA', textColor: '#219A27', label: 'Completed', category: 'Completed' };
    case 'CANCELLED':
      return { color: '#FFEBEE', textColor: '#D32F2F', label: 'Cancelled', category: 'Completed' };
    case 'DECLINED':
      return { color: '#FBE3E3', textColor: '#D06060', label: 'Declined', category: 'Completed' };
    case 'EXPIRED':
      return { color: '#F0F0F0', textColor: '#8A8A8A', label: 'Expired', category: 'Completed' };
    case 'PENDING':
      return { color: '#FFF3D0', textColor: '#E5A33D', label: 'Pending', category: 'Upcoming' };
    default:
      return { color: '#F5F5F5', textColor: '#757575', label: status || 'Unknown', category: 'Upcoming' };
  }
};

export default function SitterBookingsScreen({ navigation }) {
  const [selectedTab, setSelectedTab] = useState('All');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingId, setMarkingId] = useState(null);
  const [careModalBooking, setCareModalBooking] = useState(null);
  const [finishModalBooking, setFinishModalBooking] = useState(null);
  const [finishKind, setFinishKind] = useState(null);
  const [finishNote, setFinishNote] = useState('');
  const [photoUris, setPhotoUris] = useState([]);
  const [actionBusy, setActionBusy] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSitterBookings();
      // API shape: { success, data: { bookings: [...], total } }. Reach into
      // data.bookings; keep looser fallbacks in case the shape changes.
      const bookingsArray =
        response?.data?.bookings ||
        response?.bookings ||
        (Array.isArray(response?.data) ? response.data : null) ||
        (Array.isArray(response) ? response : []);

      setBookings(bookingsArray.map(booking => {
        const statusStyle = getStatusStyle(booking.status);
        const startDate = booking.startDate ? new Date(booking.startDate) : null;
        const endDate = booking.endDate ? new Date(booking.endDate) : null;

        const formatShortDate = (d) => {
          if (!d) return '';
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
        };

        const formatDateTime = (start, end) => {
          if (!start) return '';
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const dateStr = `${months[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`;
          const startTime = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          const endTime = end ? end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';
          return endTime ? `${dateStr} | ${startTime} - ${endTime}` : `${dateStr} | ${startTime}`;
        };

        // The client (booking owner) is returned under `user`.
        const client = booking.owner || booking.user || booking.client || {};
        const avatar = client.avatarUrl || client.profileImage;

        return {
          id: booking.id || booking._id,
          clientUserId: client.id || null,
          clientName: client.fullName || client.name || 'Client',
          clientImage: avatar ? { uri: avatar } : DogImage,
          petName: booking.pet?.name || '',
          petId: booking.pet?.id || booking.petId || null,
          serviceType: humanizeService(booking.serviceType || booking.service),
          date: formatShortDate(startDate),
          dateTime: formatDateTime(startDate, endDate),
          address: client.address || '',
          phone: client.phone || '',
          status: statusStyle.label,
          statusColor: statusStyle.color,
          statusTextColor: statusStyle.textColor,
          category: statusStyle.category,
          rating: booking.rating || null,
          coins: booking.totalAmount || booking.totalPrice || booking.coins || null,
          // Raw fields for the completion flow (the flattened `status` is a label).
          rawStatus: (booking.status || '').toUpperCase(),
          startAtMs: startDate ? startDate.getTime() : null,
          completionRequestedAt: booking.completionRequestedAt || null,
          sittingStartedAt: booking.sittingStartedAt || null,
          petCare: {
            feedingSchedule: booking.pet?.feedingSchedule,
            pottyBreak: booking.pet?.pottyBreak,
            foodAllergies: booking.pet?.foodAllergies,
            medicationAllergies: booking.pet?.medicationAllergies,
            medications: booking.pet?.medications,
            additionalInstructions: booking.pet?.additionalInstructions,
          },
        };
      }));
    } catch (err) {
      console.error('Failed to fetch sitter bookings:', err);
      setError(err?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const tabs = ['All', 'Upcoming', 'Completed'];

  const handleBack = () => {
    navigation.goBack();
  };

  const doMarkComplete = async (booking, quiet = false) => {
    try {
      setMarkingId(booking.id);
      await markBookingCompleted(booking.id);
      await fetchBookings();
      if (!quiet) {
        Alert.alert(
          'Marked complete',
          'We’ve asked the owner to confirm. Once they do (or after 3 days), your TreatCoins are released.'
        );
      }
      return true;
    } catch (err) {
      if (!quiet) Alert.alert('Could not mark complete', err?.message || 'Please try again in a moment.');
      return false;
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkComplete = (booking) => {
    Alert.alert(
      'Mark as completed?',
      'Confirm you’ve finished this booking. The owner will be asked to confirm before your TreatCoins are released.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark completed', onPress: () => doMarkComplete(booking) },
      ]
    );
  };

  const confirmStartSitting = async () => {
    if (!careModalBooking || actionBusy) return;
    setActionBusy(true);
    try {
      await startSitting(careModalBooking.id);
      const petName = careModalBooking.petName;
      setCareModalBooking(null);
      await fetchBookings();
      Alert.alert('Sitting started', `You’re ready to care for ${petName || 'this pet'}.`);
    } catch (err) {
      Alert.alert('Could not start sitting', err?.message || 'Please try again in a moment.');
    } finally {
      setActionBusy(false);
    }
  };

  const openFinishPrompt = (booking) => {
    setFinishKind(null);
    setFinishNote('');
    setPhotoUris([]);
    setFinishModalBooking(booking);
  };

  const finishWithoutUpdate = async () => {
    if (!finishModalBooking || actionBusy) return;
    const done = await doMarkComplete(finishModalBooking);
    if (done) setFinishModalBooking(null);
  };

  const chooseVisitPhotos = async () => {
    if (photoUris.length >= 3 || actionBusy) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 3 - photoUris.length,
        quality: 0.8,
      });
      if (!result.canceled) {
        const selected = (result.assets || []).map(asset => asset.uri).filter(Boolean);
        setPhotoUris(current => [...current, ...selected].slice(0, 3));
      }
    } catch (err) {
      Alert.alert('Could not choose photos', err?.message || 'Please try again.');
    }
  };

  const sendVisitUpdate = async () => {
    const booking = finishModalBooking;
    if (!booking || actionBusy) return;
    if (!finishKind && !finishNote.trim() && photoUris.length === 0) {
      Alert.alert('Add an update', 'Choose Walk, Meal, or Potty, add a note, or attach a photo.');
      return;
    }
    if (!booking.petId) {
      Alert.alert('Pet details unavailable', 'This booking is missing its pet information.');
      return;
    }
    setActionBusy(true);
    try {
      const photoUrls = [];
      for (const uri of photoUris) {
        const image = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 1280 } }],
          { compress: 0.62, format: ImageManipulator.SaveFormat.JPEG }
        );
        const uploaded = await uploadToCloudinary(image.uri, CLOUDINARY_FOLDERS.PETS, {
          tags: ['care-update'],
          context: `pet_id=${booking.petId}|booking_id=${booking.id}`,
        });
        photoUrls.push(uploaded.url);
      }
      await api.post(`/pets/${booking.petId}/care-entries`, {
        kind: finishKind || 'CARE_UPDATE',
        note: finishNote.trim(),
        photoUrls,
        bookingId: booking.id,
      });
      const completed = await doMarkComplete(booking, true);
      setFinishModalBooking(null);
      if (completed) {
        Alert.alert('Update sent', `${booking.petName || 'Your pet'}’s visit update is ready for the owner.`);
      } else {
        Alert.alert('Update sent', 'The owner received the care update. Please reopen the booking to finish it.');
      }
    } catch (err) {
      Alert.alert('Could not send update', err?.message || 'Please try again in a moment.');
    } finally {
      setActionBusy(false);
    }
  };

  // Filter bookings based on selected tab
  const getFilteredBookings = () => {
    if (selectedTab === 'All') {
      return bookings;
    }
    return bookings.filter(booking => booking.category === selectedTab);
  };

  const filteredBookings = getFilteredBookings();

  const renderBookingCard = (booking) => {
    const isUpcoming = booking.category === 'Upcoming';
    const isCompleted = booking.status === 'Completed';
    const hasMeta = booking.dateTime || booking.address || booking.petName || booking.phone ||
      (isCompleted && (booking.coins || booking.rating));

    const isActiveBooking =
      ['CONFIRMED', 'ONGOING'].includes(booking.rawStatus) &&
      booking.startAtMs != null &&
      booking.startAtMs <= Date.now() &&
      !booking.completionRequestedAt;
    const canStartSitting = isActiveBooking && !booking.sittingStartedAt;
    const canFinishSitting = isActiveBooking && !!booking.sittingStartedAt;
    const awaitingConfirm =
      !!booking.completionRequestedAt &&
      ['CONFIRMED', 'ONGOING'].includes(booking.rawStatus);
    const isMarking = markingId === booking.id;

    return (
      <View key={booking.id} style={styles.card}>
        {/* Header row */}
        <View style={styles.cardTop}>
          <Image source={booking.clientImage} style={styles.avatar} />
          <View style={styles.cardHeadInfo}>
            <Text style={styles.clientName} numberOfLines={1}>{booking.clientName}</Text>
            <Text style={styles.serviceLine} numberOfLines={1}>
              {booking.serviceType}{booking.date ? ` · ${booking.date}` : ''}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: booking.statusColor }]}>
            <Text style={[styles.statusText, { color: booking.statusTextColor }]}>
              {booking.status}
            </Text>
          </View>
        </View>

        {hasMeta && <View style={styles.cardDivider} />}

        {/* Meta + actions */}
        {hasMeta && (
          <View style={styles.cardBottom}>
            <View style={styles.metaColumn}>
              {!!booking.dateTime && (
                <View style={styles.metaRow}>
                  <Icon name="time-outline" size={15} color="#56AA9A" />
                  <Text style={styles.metaText} numberOfLines={1}>{booking.dateTime}</Text>
                </View>
              )}
              {!!booking.address && (
                <View style={styles.metaRow}>
                  <Icon name="location-outline" size={15} color="#56AA9A" />
                  <Text style={styles.metaText} numberOfLines={2}>{booking.address}</Text>
                </View>
              )}
              {!!booking.petName && (
                <View style={styles.metaRow}>
                  <Icon name="paw-outline" size={15} color="#56AA9A" />
                  <Text style={styles.metaText} numberOfLines={1}>{booking.petName}</Text>
                </View>
              )}
              {!!booking.phone && (
                <View style={styles.metaRow}>
                  <Icon name="call-outline" size={14} color="#56AA9A" />
                  <Text style={styles.metaText} numberOfLines={1}>{booking.phone}</Text>
                </View>
              )}
              {isCompleted && !!booking.coins && (
                <View style={styles.metaRow}>
                  <CoinIcon width={16} height={16} fill="#FBCE04" />
                  <Text style={styles.coinsText}>{booking.coins} TreatCoins</Text>
                </View>
              )}
              {isCompleted && !!booking.rating && (
                <View style={styles.metaRow}>
                  <StarIcon width={14} height={14} fill="#FBBC04" />
                  <Text style={styles.metaText}>{booking.rating}</Text>
                </View>
              )}
            </View>

            {isUpcoming && (
              <TouchableOpacity
                style={[styles.chatButton, !booking.clientUserId && styles.chatButtonDisabled]}
                onPress={() => booking.clientUserId && navigation.navigate('ChatConversation', {
                  otherUserId: booking.clientUserId,
                  chatName: booking.clientName,
                  avatar: booking.clientImage,
                  mode: 'sitter',
                })}
                disabled={!booking.clientUserId}
              >
                <ChatIcon width={20} height={20} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Start prompt, end-of-sitting update prompt, and owner confirmation state */}
        {canStartSitting && (
          <TouchableOpacity
            style={[styles.markButton, isMarking && styles.markButtonDisabled]}
            onPress={() => setCareModalBooking(booking)}
            disabled={isMarking}
          >
            <Icon name="paw-outline" size={16} color="#FFFFFF" />
            <Text style={styles.markButtonText}>Start sitting</Text>
          </TouchableOpacity>
        )}
        {canFinishSitting && (
          <TouchableOpacity
            style={[styles.markButton, isMarking && styles.markButtonDisabled]}
            onPress={() => openFinishPrompt(booking)}
            disabled={isMarking}
          >
            <Icon name="checkmark-circle-outline" size={16} color="#FFFFFF" />
            <Text style={styles.markButtonText}>Finish sitting</Text>
          </TouchableOpacity>
        )}
        {awaitingConfirm && (
          <View style={styles.awaitingRow}>
            <Icon name="hourglass-outline" size={14} color="#E5A33D" />
            <Text style={styles.awaitingText}>Waiting for owner to confirm</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <BackArrowIcon width={20} height={20} fill="#090E12" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bookings</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <View style={styles.tabBackground}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  selectedTab === tab && styles.activeTab,
                ]}
                onPress={() => setSelectedTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bookings List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#56AA9A" />
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchBookings}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredBookings.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No bookings found</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredBookings.map(renderBookingCard)}
          </ScrollView>
        )}
      </View>

      <Modal visible={!!careModalBooking} transparent animationType="slide" onRequestClose={() => setCareModalBooking(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Before you start</Text>
            <Text style={styles.modalSubtitle}>{careModalBooking?.petName || 'Pet'} — review the care instructions, then start sitting.</Text>
            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <View style={styles.careInfoItem}><Text style={styles.careInfoLabel}>Feeding routine</Text><Text style={styles.careInfoValue}>{careText(careModalBooking?.petCare?.feedingSchedule)}</Text></View>
              <View style={styles.careInfoItem}><Text style={styles.careInfoLabel}>Potty breaks</Text><Text style={styles.careInfoValue}>{careText(careModalBooking?.petCare?.pottyBreak)}</Text></View>
              <View style={styles.careInfoItem}><Text style={styles.careInfoLabel}>Food allergies</Text><Text style={styles.careInfoValue}>{careText(careModalBooking?.petCare?.foodAllergies)}</Text></View>
              <View style={styles.careInfoItem}><Text style={styles.careInfoLabel}>Medication allergies</Text><Text style={styles.careInfoValue}>{careText(careModalBooking?.petCare?.medicationAllergies)}</Text></View>
              <View style={styles.careInfoItem}><Text style={styles.careInfoLabel}>Medications</Text><Text style={styles.careInfoValue}>{careText(careModalBooking?.petCare?.medications)}</Text></View>
              <View style={styles.careInfoItem}><Text style={styles.careInfoLabel}>Special instructions</Text><Text style={styles.careInfoValue}>{careText(careModalBooking?.petCare?.additionalInstructions)}</Text></View>
            </ScrollView>
            <TouchableOpacity style={[styles.modalPrimary, actionBusy && styles.markButtonDisabled]} onPress={confirmStartSitting} disabled={actionBusy}>
              {actionBusy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.modalPrimaryText}>Start sitting</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSecondary} onPress={() => setCareModalBooking(null)} disabled={actionBusy}>
              <Text style={styles.modalSecondaryText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!finishModalBooking} transparent animationType="slide" onRequestClose={() => !actionBusy && setFinishModalBooking(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Visit update</Text>
            <Text style={styles.modalSubtitle}>Share how {finishModalBooking?.petName || 'your pet'} is doing.</Text>
            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <Text style={styles.careInfoLabel}>What did you do?</Text>
              <View style={styles.updateChoices}>
                {[
                  ['WALK', 'Walk'],
                  ['MEAL', 'Meal'],
                  ['POTTY', 'Potty'],
                ].map(([kind, label]) => (
                  <TouchableOpacity key={kind} style={[styles.updateChoice, finishKind === kind && styles.updateChoiceSelected]} onPress={() => setFinishKind(current => current === kind ? null : kind)}>
                    <Text style={[styles.updateChoiceText, finishKind === kind && styles.updateChoiceTextSelected]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput value={finishNote} onChangeText={setFinishNote} placeholder="Add a note (optional)" placeholderTextColor="#818898" multiline maxLength={1000} style={styles.updateNote} />
              <Text style={styles.photoHint}>Add up to 3 photos. The booking owner can view this update in the pet’s care history.</Text>
              <View style={styles.photoPreviewRow}>
                {photoUris.map((uri, index) => (
                  <View key={uri} style={styles.photoPreviewWrap}>
                    <Image source={{ uri }} style={styles.photoPreview} />
                    <TouchableOpacity style={styles.photoRemove} onPress={() => setPhotoUris(current => current.filter((_, i) => i !== index))} disabled={actionBusy}>
                      <Text style={styles.photoRemoveText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {photoUris.length < 3 && <TouchableOpacity style={styles.addPhotoButton} onPress={chooseVisitPhotos} disabled={actionBusy}><Icon name="camera-outline" size={20} color="#1686A8" /><Text style={styles.addPhotoText}>Add photos</Text></TouchableOpacity>}
              </View>
            </ScrollView>
            <TouchableOpacity style={[styles.modalPrimary, actionBusy && styles.markButtonDisabled]} onPress={sendVisitUpdate} disabled={actionBusy}>
              {actionBusy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.modalPrimaryText}>Send update</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSecondary} onPress={finishWithoutUpdate} disabled={actionBusy}>
              <Text style={styles.modalSecondaryText}>Finish without an update</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 24.8,
  },
  headerPlaceholder: {
    width: 40,
  },
  tabContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 18,
  },
  tabBackground: {
    height: 52,
    backgroundColor: '#F5F5F5',
    borderRadius: 50,
    flexDirection: 'row',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 13,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#858585',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 50,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#858585',
    lineHeight: 18.2,
    textAlign: 'center',
  },
  activeTabText: {
    fontWeight: '500',
    color: '#45594B',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#858585',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#56AA9A',
    borderRadius: 30,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  emptyText: {
    color: '#858585',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 15,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    padding: 14,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
  },
  cardHeadInfo: {
    flex: 1,
  },
  clientName: {
    color: '#040404',
    fontSize: 15,
    fontFamily: 'Poppins',
    fontWeight: '500',
    lineHeight: 21,
  },
  serviceLine: {
    color: '#818898',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 17,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 30,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Poppins',
    fontWeight: '600',
    lineHeight: 15.5,
    textAlign: 'center',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaColumn: {
    flex: 1,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    flex: 1,
    color: '#5B6B7B',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 17,
  },
  coinsText: {
    color: '#56AA9A',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '600',
    lineHeight: 17,
  },
  chatButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(86, 170, 154, 0.15)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButtonDisabled: {
    opacity: 0.4,
  },
  markButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 11,
    borderRadius: 30,
    backgroundColor: '#219A27',
  },
  markButtonDisabled: {
    opacity: 0.6,
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 18 },
  modalCard: { width: '100%', maxHeight: '90%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18 },
  modalTitle: { color: '#173342', fontSize: 21, fontWeight: '800', marginBottom: 5 },
  modalSubtitle: { color: '#58707C', fontSize: 14, lineHeight: 20, marginBottom: 14 },
  modalScroll: { flexGrow: 0, marginBottom: 12 },
  careInfoItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E6EEF1' },
  careInfoLabel: { color: '#173342', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  careInfoValue: { color: '#4D6570', fontSize: 14, lineHeight: 20 },
  modalPrimary: { minHeight: 48, backgroundColor: '#1686A8', borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: 8 },
  modalPrimaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  modalSecondary: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  modalSecondaryText: { color: '#1686A8', fontSize: 14, fontWeight: '700' },
  updateChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 },
  updateChoice: { borderWidth: 1, borderColor: '#C8DCE5', borderRadius: 18, paddingVertical: 9, paddingHorizontal: 15, backgroundColor: '#F8FBFC' },
  updateChoiceSelected: { backgroundColor: '#1686A8', borderColor: '#1686A8' },
  updateChoiceText: { color: '#34515F', fontSize: 13, fontWeight: '700' },
  updateChoiceTextSelected: { color: '#FFFFFF' },
  updateNote: { minHeight: 84, borderRadius: 12, borderWidth: 1, borderColor: '#D7E4EA', padding: 12, textAlignVertical: 'top', marginTop: 12, color: '#173342' },
  photoHint: { color: '#627783', fontSize: 12, lineHeight: 17, marginTop: 12 },
  photoPreviewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10, alignItems: 'center' },
  photoPreviewWrap: { position: 'relative' },
  photoPreview: { width: 76, height: 76, borderRadius: 11 },
  photoRemove: { position: 'absolute', right: -6, top: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D8E2E7' },
  photoRemoveText: { color: '#A52F2A', fontSize: 18, fontWeight: '700', lineHeight: 21 },
  addPhotoButton: { minHeight: 76, borderRadius: 11, borderWidth: 1, borderColor: '#C8DCE5', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, minWidth: 90 },
  addPhotoText: { color: '#1686A8', fontSize: 12, fontWeight: '700', marginTop: 2 },
  markButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '600',
    lineHeight: 18,
  },
  awaitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 9,
    borderRadius: 30,
    backgroundColor: '#FFF6E6',
  },
  awaitingText: {
    color: '#E5A33D',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '600',
    lineHeight: 17,
  },
});
