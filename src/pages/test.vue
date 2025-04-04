<template>
  <div class="users-box" v-if="activeTab !== 'personal'">
    <h3>Users</h3>
    <ul>
      <li v-for="(username, index) in groupUsernames" :key="index">
        {{ username }}
      </li>
    </ul>
  </div>
  
  <div class="calendar-container">
    <!-- Tab Navigation -->
    <div class="tab-bar">
      <button :class="{ active: activeTab === 'personal' }" @click="switchToPersonal">
        Personal
      </button>
      <button
        v-for="group in groups"
        :key="group.id"
        :class="{ active: activeTab === group.id }"
        @click="switchToGroup(group)"
      >
        {{ group.groupName }}
      </button>
      <button class="add-group" :disabled="groups.length >= 5" @click="toggleGroupModal">
        +
      </button>
    </div>

    <!-- Group Details (only when a group is active) -->
    <div v-if="activeTab !== 'personal'" class="group-details">
      <div class="coordinates-oval">
        <span>PlanIt Coordinates: {{ activeTab }}</span>
      </div>
      <button @click="copyGroupId(activeTab)" class="copy-button">
        <img src="/public/pngwing.com.png" alt="Copy" />
      </button>
      <button @click="leaveGroup" class="leave-group">Blast off from PlanIt</button>
    </div>

    <!-- Group Modal Popup -->
    <div v-if="showGroupModal" class="modal-overlay" @click.self="toggleGroupModal">
      <div class="modal-content">
        <h2>Join or Create Group</h2>
        <input type="text" v-model="groupIdInput" placeholder="Enter Group ID" />
        <input type="text" v-model="groupNameInput" placeholder="Enter Group Name (if new)" />
        <button @click="joinOrCreateGroup">Submit</button>
        <button @click="toggleGroupModal">Cancel</button>
      </div>
    </div>

    <!-- Week Navigation -->
    <div class="navigation">
      <button @click="prevWeek">Previous Week</button>
      <span>{{ weekDisplay }}</span>
      <button @click="nextWeek">Next Week</button>
    </div>

    <!-- Calendar Table -->
    <div class="calendar">
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th v-for="day in days" :key="day.date">
              {{ day.name }}<br />
              <small>{{ day.display }}</small>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="time in times" :key="time">
            <td class="time-cell">{{ formatTime(time) }}</td>
            <td
              v-for="day in days"
              :key="day.date"
              class="calendar-cell"
              :class="{ 'free-slot': activeTab !== 'personal' && nextFiveFreeSlots.includes(day.date + '-' + time) }"
              @click="handleCellClick(day, time)"
            >
              <div v-if="displayedEvent(day, time)" class="event-display">
                <div v-for="(event, index) in displayedEvent(day, time)" :key="index">
                  {{ event.title }}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal for Adding New Event -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
      <div class="modal-content">
        <h2>Add Event</h2>
        <input type="text" v-model="newEventTitle" placeholder="Event Title" />
        <input type="text" v-model="newEventDescription" placeholder="Event Description" />
        <label>
          Recurrence:
          <select v-model="recurrenceOption">
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </label>
        <button @click="confirmAddEvent">Add</button>
        <button @click="closeAddModal">Cancel</button>
      </div>
    </div>

    <!-- Modal for Viewing / Editing Event Details -->
    <div v-if="showViewModal" class="modal-overlay" @click.self="closeViewModal">
      <div class="modal-content">
        <div v-if="!isEditing">
          <div v-if="selectedEvent.multiple">
            <h2>Multiple Events</h2>
            <ul>
              <li v-for="(ev, index) in selectedEvent.events" :key="index" class="event-entry">
                <strong>{{ ev.title }}</strong>
                <div>{{ ev.description }}</div>
                <small>From: {{ ev.source }}</small>
              </li>
            </ul>
          </div>
          <div v-else>
            <h2>{{ selectedEvent.title }}</h2>
            <p>{{ selectedEvent.description }}</p>
            <p v-if="selectedEvent.recurrence && selectedEvent.recurrence !== 'none'">
              Recurring: {{ selectedEvent.recurrence }}
            </p>
          </div>
          <button @click="startEditing">Edit</button>
          <button @click="deleteEvent">Delete</button>
          <button @click="closeViewModal">Close</button>
        </div>
        <div v-else>
          <h2>Edit Event</h2>
          <input type="text" v-model="editTitle" placeholder="Event Title" />
          <input type="text" v-model="editDescription" placeholder="Event Description" />
          <label>
            Recurrence:
            <select v-model="editRecurrence">
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
          <button @click="confirmEditEvent">Save</button>
          <button @click="cancelEditing">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { onMounted, onUnmounted } from "vue";
import useCalendar from "../useCalendar";

// Destructure the composable’s reactive state and functions.
const {
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
  showGroupModal
} = useCalendar();

// Example lifecycle usage:
onMounted(() => {
  loadUserGroups();
  // Subscribe based on current active tab.
  if (activeTab.value === "personal") {
    subscribePersonalEvents();
  }
});
onUnmounted(() => {
  // Clean up subscriptions if necessary.
});
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  background-image: url('/sp.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
}
</style>

<style scoped>
.event-entry {
  background-color: rgba(255, 255, 255, 0.05);
  padding: 10px;
  margin-bottom: 8px;
  border-radius: 8px;
  text-align: left;
}
.users-box ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.users-box li {
  background-color: rgba(255, 255, 255, 0.05);
  margin: 5px 0;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 14px;
}
.users-box {
  position: absolute;
  left: 10px;
  top: 60px;
  width: 150px;
  height: 200px;
  background: rgba(18, 22, 38, 0.9);
  border: 2px solid #4e3a8e;
  border-radius: 12px;
  padding: 10px;
  color: white;
  z-index: 100;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.6);
}
.users-box h3 {
  margin-top: 0;
  text-align: center;
}
.calendar table {
  table-layout: fixed;
  width: 100%;
}
.calendar-container {
  width: 1000px;
  margin: 50px auto;
  border: 2px solid #2d2159;
  padding: 15px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.7);
}
.tab-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
}
.tab-bar button {
  background: linear-gradient(to right, #6a11cb, #2575fc);
  border: none;
  color: white;
  padding: 8px 15px;
  cursor: pointer;
  margin: 0 5px 5px;
  border-radius: 20px;
  box-shadow: 0 0 10px rgba(106, 17, 203, 0.5);
  transition: transform 0.2s;
}
.tab-bar button:hover,
.tab-bar button.active {
  transform: scale(1.1);
  background: linear-gradient(to right, #ff00cc, #333399);
}
.group-details {
  text-align: center;
  margin-bottom: 15px;
}
.group-details span {
  font-weight: bold;
}
.leave-group {
  background-color: #e63946;
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 15px;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(230, 57, 70, 0.6);
}
.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 15px 0;
}
.navigation button {
  background-color: #6a11cb;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(106, 17, 203, 0.7);
  transition: transform 0.2s;
}
.navigation button:hover {
  transform: scale(1.1);
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: rgba(20, 30, 48, 0.95);
  padding: 20px;
  border-radius: 10px;
  max-width: 400px;
  text-align: center;
  z-index: 1100;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.9);
  color: #fff;
}
input, select {
  padding: 6px;
  width: 100%;
  margin-bottom: 10px;
  border-radius: 5px;
  border: none;
  background-color: #1a1e30;
  color: #fff;
}
.calendar {
  width: 100%;
  overflow-x: auto;
}
.calendar::-webkit-scrollbar {
  display: none;
}
.calendar table {
  border-collapse: collapse;
  width: 100%;
  border: 1px solid #4e3a8e;
  background: rgba(18, 22, 38, 0.85);
  border-radius: 10px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.6);
}
th, td {
  border: 1px solid #4e3a8e;
  padding: 10px;
  text-align: center;
  cursor: pointer;
}
th {
  background: linear-gradient(to bottom, #2575fc, #6a11cb);
  color: #fff;
}
.event-display {
  background-color: rgba(106, 17, 203, 0.7);
  border-radius: 5px;
  padding: 5px;
}
.event-display.multiple {
  background-color: rgba(203, 20, 17, 0.7);
  border-radius: 5px;
  padding: 5px;
}
.time-cell {
  background-color: rgba(37, 117, 252, 0.4);
  font-weight: bold;
  color: #e6e6e6;
}
.free-slot {
  background-color: rgba(0, 255, 0, 0.3) !important;
}

/* Style for the small PNG copy button */
.copy-button {
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
}
.copy-button img {
  width: 16px;
  height: 16px;
}

/* New styling for the oval behind "PlanIt Coordinates" and the group ID */
.coordinates-oval {
  display: inline-block;
  padding: 10px 20px;
  background: linear-gradient(145deg, #1a1a2e, #0d0d2b);
  border-radius: 50px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.7);
  font-family: 'Orbitron', sans-serif;
  color: #fff;
  margin-bottom: 10px;
}
</style>
