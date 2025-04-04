
import { ref, computed, onMounted, onUnmounted } from "vue";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayRemove,
  arrayUnion,
  getDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

// Firebase initialization
const auth = getAuth();
const db = getFirestore();

// ----- Calendar Setup -----
const times = ref([8, 9, 10, 11, 12, 13, 14, 15, 16]);

function formatDate(date) {
  const options = { month: "short", day: "numeric" };
  return date.toLocaleDateString(undefined, options);
}

function getDayName(date) {
  return date.toLocaleDateString(undefined, { weekday: "long" });
}

const currentDate = new Date();

function getMonday(date) {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return monday;
}

const currentMonday = ref(getMonday(currentDate));

const days = computed(() => {
  const arr = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(currentMonday.value);
    d.setDate(currentMonday.value.getDate() + i);
    arr.push({
      name: getDayName(d),
      date: d.toISOString().split("T")[0],
      display: formatDate(d),
    });
  }
  return arr;
});

const weekDisplay = computed(() => {
  const first = days.value[0];
  const last = days.value[days.value.length - 1];
  return `${first.display} - ${last.display}`;
});

function formatTime(hour) {
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${ampm}`;
}

function nextWeek() {
  const newMonday = new Date(currentMonday.value);
  newMonday.setDate(currentMonday.value.getDate() + 7);
  currentMonday.value = newMonday;
}

function prevWeek() {
  const newMonday = new Date(currentMonday.value);
  newMonday.setDate(currentMonday.value.getDate() - 7);
  currentMonday.value = newMonday;
}

// ----- Event Handling State -----
const personalEvents = ref({});
const groupEvents = ref({});
const recurringPersonalEvents = ref([]);
const recurringGroupEvents = ref([]);

const showAddModal = ref(false);
const showViewModal = ref(false);
const isEditing = ref(false);
const selectedEvent = ref({});

const newEventTitle = ref("");
const newEventDescription = ref("");
const recurrenceOption = ref("none");
const newEventCell = ref({ day: null, time: null });
const editTitle = ref("");
const editDescription = ref("");
const editRecurrence = ref("none");

// ----- Group Modal & Users State -----
const showGroupModal = ref(false);
const groupIdInput = ref("");
const groupNameInput = ref("");
const groupUsernames = ref([]);

// Reactive variable for group members' personal events
const groupMembersEvents = ref({});

// ----- Active Tab & Groups -----
const activeTab = ref("personal");
const groups = ref([]);

// ----- Functions -----
// Toggle group modal
function toggleGroupModal() {
  showGroupModal.value = !showGroupModal.value;
}

// Calendar Cell Click Handling
function handleCellClick(day, time) {
  const key = `${day.date}-${time}`;
  if (activeTab.value === "personal") {
    const persEv = personalEvents.value[key];
    if (!persEv) {
      newEventCell.value = { day, time };
      newEventTitle.value = "";
      newEventDescription.value = "";
      recurrenceOption.value = "none";
      showAddModal.value = true;
      return;
    } else {
      selectedEvent.value = { ...persEv, key, day, time };
      isEditing.value = false;
      showViewModal.value = true;
      return;
    }
  } else {
    const events = getAllEventsForSlot(day, time);
    if (events.length === 0) {
      newEventCell.value = { day, time };
      newEventTitle.value = "";
      newEventDescription.value = "";
      recurrenceOption.value = "none";
      showAddModal.value = true;
    } else if (events.length === 1) {
      selectedEvent.value = { ...events[0], key, day, time };
      isEditing.value = false;
      showViewModal.value = true;
    } else {
      // If multiple events, store them as an array
      selectedEvent.value = { events: events, key, day, time };
      isEditing.value = false;
      showViewModal.value = true;
    }
  }
}

function closeAddModal() {
  showAddModal.value = false;
  newEventCell.value = { day: null, time: null };
}

function closeViewModal() {
  showViewModal.value = false;
  selectedEvent.value = {};
  isEditing.value = false;
}

// Recurring Event Helper
function recurringMatch(ev, day, time) {
  if (parseInt(ev.time) !== time) return false;
  const cellDate = new Date(day.date);
  if (ev.exceptions && ev.exceptions.includes(day.date)) return false;
  const startDate = new Date(ev.day);
  if (cellDate < startDate) return false;
  if (ev.recurrence === "daily") return true;
  if (ev.recurrence === "weekly") return startDate.getDay() === cellDate.getDay();
  return false;
}

// Add Event
async function confirmAddEvent() {
  if (newEventTitle.value.trim() === "") return;
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in to add events.");
    return;
  }
  const day = newEventCell.value.day;
  const time = newEventCell.value.time;
  const key = `${day.date}-${time}`;
  const eventData = {
    title: newEventTitle.value,
    description: newEventDescription.value,
    day: day.date,
    time: time,
    recurrence: recurrenceOption.value,
    exceptions: [],
    createdAt: serverTimestamp(),
    createdBy: user.uid,
  };
  let eventDocRef;
  if (activeTab.value === "personal") {
    eventDocRef = doc(db, "users", user.uid, "events", key);
  } else {
    eventDocRef = doc(db, "groups", activeTab.value, "events", key);
  }
  try {
    await setDoc(eventDocRef, eventData);
  } catch (err) {
    console.error("Error adding event: ", err);
  }
  closeAddModal();
}

// Aggregated View Functions
function getAllEventsForSlot(day, time) {
  const key = `${day.date}-${time}`;
  const events = [];
  if (activeTab.value === "personal") {
    const persEv = personalEvents.value[key];
    const grpEv = groupEvents.value[key];
    if (persEv) events.push({ ...persEv, source: "Personal" });
    if (grpEv) events.push({ ...grpEv, source: "Group" });
    recurringPersonalEvents.value
      .filter((ev) => recurringMatch(ev, day, time))
      .forEach((ev) => events.push({ ...ev, source: "Personal" }));
    recurringGroupEvents.value
      .filter((ev) => recurringMatch(ev, day, time))
      .forEach((ev) => events.push({ ...ev, source: "Group" }));
  } else {
    const grpEv = groupEvents.value[key];
    if (grpEv) events.push({ ...grpEv, source: "Group" });
    recurringGroupEvents.value
      .filter((ev) => recurringMatch(ev, day, time))
      .forEach((ev) => events.push({ ...ev, source: "Group" }));
  }
  return events;
}

function displayedEvent(day, time) {
  const events = getAllEventsForSlot(day, time);
  return events.length ? events : null;
}

// Event Subscription
let unsubscribeEvents;
function subscribePersonalEvents() {
  const user = auth.currentUser;
  if (!user) return;
  const unsubscribes = [];
  const persCol = collection(db, "users", user.uid, "events");
  const persQuery = query(persCol);
  const unsubPers = onSnapshot(persQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const docData = change.doc.data();
      const key = `${docData.day}-${docData.time}`;
      if (docData.recurrence && docData.recurrence !== "none") {
        const idx = recurringPersonalEvents.value.findIndex(
          (ev) => ev.id === change.doc.id
        );
        const recEv = { ...docData, id: change.doc.id };
        if (change.type === "added" || change.type === "modified") {
          if (idx > -1) {
            recurringPersonalEvents.value.splice(idx, 1, recEv);
          } else {
            recurringPersonalEvents.value.push(recEv);
          }
        } else if (change.type === "removed") {
          recurringPersonalEvents.value = recurringPersonalEvents.value.filter(
            (ev) => ev.id !== change.doc.id
          );
        }
      } else {
        if (change.type === "added" || change.type === "modified") {
          personalEvents.value[key] = { ...docData, key };
        } else if (change.type === "removed") {
          delete personalEvents.value[key];
        }
      }
    });
  });
  unsubscribes.push(unsubPers);
  groups.value.forEach((group) => {
    const grpCol = collection(db, "groups", group.id, "events");
    const grpQuery = query(grpCol);
    const unsubGrp = onSnapshot(grpQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const docData = change.doc.data();
        const key = `${docData.day}-${docData.time}`;
        if (docData.recurrence && docData.recurrence !== "none") {
          const idx = recurringGroupEvents.value.findIndex(
            (ev) => ev.id === change.doc.id
          );
          const recEv = { ...docData, id: change.doc.id };
          if (change.type === "added" || change.type === "modified") {
            if (idx > -1) {
              recurringGroupEvents.value.splice(idx, 1, recEv);
            } else {
              recurringGroupEvents.value.push(recEv);
            }
          } else if (change.type === "removed") {
            recurringGroupEvents.value = recurringGroupEvents.value.filter(
              (ev) => ev.id !== change.doc.id
            );
          }
        } else {
          if (change.type === "added" || change.type === "modified") {
            groupEvents.value[key] = { ...docData, key };
          } else if (change.type === "removed") {
            delete groupEvents.value[key];
          }
        }
      });
    });
    unsubscribes.push(unsubGrp);
  });
  return () => unsubscribes.forEach((fn) => fn());
}

function subscribeGroupEvents() {
  const grpCol = collection(db, "groups", activeTab.value, "events");
  const q = query(grpCol);
  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const docData = change.doc.data();
      const key = `${docData.day}-${docData.time}`;
      if (docData.recurrence && docData.recurrence !== "none") {
        const idx = recurringGroupEvents.value.findIndex(
          (ev) => ev.id === change.doc.id
        );
        const recEv = { ...docData, id: change.doc.id };
        if (change.type === "added" || change.type === "modified") {
          if (idx > -1) {
            recurringGroupEvents.value.splice(idx, 1, recEv);
          } else {
            recurringGroupEvents.value.push(recEv);
          }
        } else if (change.type === "removed") {
          recurringGroupEvents.value = recurringGroupEvents.value.filter(
            (ev) => ev.id !== change.doc.id
          );
        }
      } else {
        if (change.type === "added" || change.type === "modified") {
          groupEvents.value[key] = { ...docData, key };
        } else if (change.type === "removed") {
          delete groupEvents.value[key];
        }
      }
    });
  });
}

function refreshSubscription() {
  personalEvents.value = {};
  groupEvents.value = {};
  recurringPersonalEvents.value = [];
  recurringGroupEvents.value = [];
  if (unsubscribeEvents) unsubscribeEvents();
  if (activeTab.value === "personal") {
    unsubscribeEvents = subscribePersonalEvents();
  } else {
    unsubscribeEvents = subscribeGroupEvents();
  }
}

// ----- Group Loading & Tab Switching -----
async function loadUserGroups() {
  const user = auth.currentUser;
  if (!user) return;
  const groupsQuery = query(
    collection(db, "groups"),
    where("members", "array-contains", user.uid)
  );
  onSnapshot(groupsQuery, (snapshot) => {
    groups.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    if (activeTab.value === "personal") {
      refreshSubscription();
    }
  });
}

function switchToPersonal() {
  activeTab.value = "personal";
  refreshSubscription();
}

async function switchToGroup(group) {
  activeTab.value = group.id;
  refreshSubscription();
  await loadGroupUsernames(group.id);
  await loadGroupMembersPersonalEvents(group.id);
}

async function loadGroupUsernames(groupId) {
  const groupDocRef = doc(db, "groups", groupId);
  const groupSnap = await getDoc(groupDocRef);
  if (!groupSnap.exists()) return;
  const groupData = groupSnap.data();
  const memberUIDs = groupData.members || [];
  const usernames = [];
  for (const uid of memberUIDs) {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      usernames.push(userData.username || uid);
    }
  }
  groupUsernames.value = usernames;
}

async function loadGroupMembersPersonalEvents(groupId) {
  const groupDocRef = doc(db, "groups", groupId);
  const groupSnap = await getDoc(groupDocRef);
  if (!groupSnap.exists()) return;
  const groupData = groupSnap.data();
  const memberUIDs = groupData.members || [];
  const eventsData = {};
  for (const uid of memberUIDs) {
    const eventsSnapshot = await getDocs(collection(db, "users", uid, "events"));
    const userEvents = {};
    eventsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const key = `${data.day}-${data.time}`;
      userEvents[key] = true;
    });
    eventsData[uid] = userEvents;
  }
  groupMembersEvents.value = eventsData;
}

// ----- New Group Form Functions -----
async function joinOrCreateGroup() {
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in to join or create a group.");
    return;
  }
  if (groups.value.length >= 5) {
    alert("You are allowed a maximum of 5 groups.");
    return;
  }
  if (!groupIdInput.value) {
    alert("Please enter a Group ID.");
    return;
  }
  const groupDocRef = doc(db, "groups", groupIdInput.value);
  const groupDoc = await getDoc(groupDocRef);
  if (groupDoc.exists()) {
    try {
      await updateDoc(groupDocRef, { members: arrayUnion(user.uid) });
    } catch (err) {
      console.error("Error updating group members: ", err);
    }
  } else {
    if (!groupNameInput.value) {
      alert("Group does not exist. Please provide a group name to create it.");
      return;
    }
    try {
      await setDoc(groupDocRef, {
        groupName: groupNameInput.value,
        members: [user.uid],
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error creating group: ", err);
    }
  }
  groupIdInput.value = "";
  groupNameInput.value = "";
  showGroupModal.value = false;
  loadUserGroups();
  activeTab.value = "personal";
  refreshSubscription();
}

// ----- Leave Group Function -----
async function leaveGroup() {
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in to leave groups.");
    return;
  }
  const groupIdToLeave = activeTab.value;
  const groupDocRef = doc(db, "groups", groupIdToLeave);
  try {
    await updateDoc(groupDocRef, {
      members: arrayRemove(user.uid),
    });
    const updatedGroupDoc = await getDoc(groupDocRef);
    const updatedGroupData = updatedGroupDoc.data();
    if (!updatedGroupData.members || updatedGroupData.members.length === 0) {
      await deleteDoc(groupDocRef);
      console.log(`Group ${groupIdToLeave} deleted because it's empty.`);
    }
    alert("You have left the group.");
    switchToPersonal();
    loadUserGroups();
    refreshSubscription();
  } catch (err) {
    console.error("Error leaving group: ", err);
    alert("Failed to leave the group. Please try again.");
  }
}

// ----- Copy Group ID Function -----
function copyGroupId(id) {
  navigator.clipboard
    .writeText(id)
    .then(() => alert("Group ID copied to clipboard!"))
    .catch((err) => console.error("Failed to copy Group ID:", err));
}

// ----- Editing and Deleting Events -----
async function startEditing() {
  isEditing.value = true;
  editTitle.value = selectedEvent.value.title;
  editDescription.value = selectedEvent.value.description;
  editRecurrence.value = selectedEvent.value.recurrence || "none";
}

async function confirmEditEvent() {
  if (editTitle.value.trim() === "") return;
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in to edit events.");
    return;
  }
  const key = selectedEvent.value.key;
  let eventDocRef;
  if (activeTab.value === "personal") {
    eventDocRef = doc(db, "users", user.uid, "events", key);
  } else {
    eventDocRef = doc(db, "groups", activeTab.value, "events", key);
  }
  try {
    await updateDoc(eventDocRef, {
      title: editTitle.value,
      description: editDescription.value,
      recurrence: editRecurrence.value,
    });
  } catch (err) {
    console.error("Error updating event: ", err);
  }
  isEditing.value = false;
  closeViewModal();
}

async function deleteEvent() {
  if (!confirm("Are you sure you want to delete this event?")) return;
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in to delete events.");
    return;
  }
  const key = selectedEvent.value.key;
  let eventDocRef;
  if (activeTab.value === "personal") {
    eventDocRef = doc(db, "users", user.uid, "events", key);
  } else {
    eventDocRef = doc(db, "groups", activeTab.value, "events", key);
  }
  try {
    await deleteDoc(eventDocRef);
  } catch (err) {
    console.error("Error deleting event: ", err);
  }
  closeViewModal();
}

function cancelEditing() {
  isEditing.value = false;
}

// ----- Recurring Event Options -----
async function deleteOccurrence() {
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in to delete events.");
    return;
  }
  if (!selectedEvent.value.recurrence || selectedEvent.value.recurrence === "none") {
    alert("This event is not recurring.");
    return;
  }
  const exceptionDate = selectedEvent.value.day.date;
  const eventDocRef =
    activeTab.value === "personal"
      ? doc(db, "users", user.uid, "events", selectedEvent.value.key)
      : doc(db, "groups", activeTab.value, "events", selectedEvent.value.key);
  try {
    await updateDoc(eventDocRef, {
      exceptions: arrayUnion(exceptionDate),
    });
    alert("This occurrence has been removed.");
    closeViewModal();
  } catch (err) {
    console.error("Error deleting occurrence: ", err);
    alert("Failed to delete this occurrence. Please try again.");
  }
}

async function stopRecurrence() {
  if (!confirm("This will stop all future occurrences. Are you sure?")) return;
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in to delete events.");
    return;
  }
  const eventDocRef =
    activeTab.value === "personal"
      ? doc(db, "users", user.uid, "events", selectedEvent.value.key)
      : doc(db, "groups", activeTab.value, "events", selectedEvent.value.key);
  try {
    await deleteDoc(eventDocRef);
    alert("Recurring event has been stopped.");
    closeViewModal();
  } catch (err) {
    console.error("Error stopping recurring event: ", err);
    alert("Failed to stop recurring event. Please try again.");
  }
}

// ----- Computed Property for Next Five Free Slots -----
const nextFiveFreeSlots = computed(() => {
  if (!groupMembersEvents.value || Object.keys(groupMembersEvents.value).length === 0)
    return [];
  const currentTime = new Date();
  let freeSlots = [];
  days.value.forEach((day) => {
    for (let i = 0; i < times.value.length; i++) {
      const time = times.value[i];
      const slotDateTime = new Date(`${day.date}T${time < 10 ? "0" + time : time}:00:00`);
      if (slotDateTime < currentTime) continue;
      const key = `${day.date}-${time}`;
      let allFree = true;
      
      // Check each group member's personal events.
      for (const uid in groupMembersEvents.value) {
        if (groupMembersEvents.value[uid] && groupMembersEvents.value[uid][key]) {
          allFree = false;
          break;
        }
      }
      
      // If in group mode, check group events.
      if (allFree && activeTab.value !== "personal") {
        if (groupEvents.value[key]) {
          allFree = false;
        }
        if (allFree) {
          for (const ev of recurringGroupEvents.value) {
            if (recurringMatch(ev, day, time)) {
              allFree = false;
              break;
            }
          }
        }
      }
      
      if (allFree) {
        freeSlots.push(key);
        break;
      }
    }
  });
  return freeSlots;
});

// ----- Export the composable -----
export default function useCalendar() {
  return {
    auth,
    db,
    times,
    days,
    weekDisplay,
    nextFiveFreeSlots,
    handleCellClick,
    closeAddModal,
    closeViewModal,
    confirmAddEvent,
    displayedEvent,
    formatTime,
    nextWeek,
    prevWeek,
    subscribePersonalEvents,
    subscribeGroupEvents,
    refreshSubscription,
    activeTab,
    personalEvents,
    groupEvents,
    recurringPersonalEvents,
    recurringGroupEvents,
    groupMembersEvents,
    toggleGroupModal,
    groupIdInput,
    groupNameInput,
    groupUsernames,
    groups,
    loadUserGroups,
    switchToPersonal,
    switchToGroup,
    loadGroupUsernames,
    loadGroupMembersPersonalEvents,
    joinOrCreateGroup,
    leaveGroup,
    copyGroupId,
    startEditing,
    confirmEditEvent,
    deleteEvent,
    cancelEditing,
    deleteOccurrence,
    stopRecurrence,
    formatDate,
    getDayName,
    getMonday,
    currentMonday,
    newEventTitle,
    newEventDescription,
    recurrenceOption,
    newEventCell,
    editTitle,
    editDescription,
    editRecurrence,
    showAddModal,
    showViewModal,
    isEditing,
    selectedEvent,
    showGroupModal,
  };
}
