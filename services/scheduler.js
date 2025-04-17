

const User = require('../models/User');
const Availability = require('../models/Availability');
const Shift = require('../models/Shift');
const ShiftConfig = require('../models/ShiftConfig'); // ✅ dynamic config

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const SHIFT_TYPES = ['morning', 'afternoon', 'night'];

async function generateWeeklySchedule() {
  const users = await User.find();
  const availabilities = await Availability.find().populate('user');
  const config = await ShiftConfig.findOne();

  const minEmployeesPerShift = config?.minEmployeesPerShift || 1;
  const maxEmployeesPerShift = config?.maxEmployeesPerShift || 3;

  const weeklyShifts = [];

  // ✅ Clear all previous user notifications
  await User.updateMany({}, { $set: { notification: '' } });

  for (const day of DAYS) {
    for (const shiftType of SHIFT_TYPES) {
      const shift = {
        day,
        shiftType,
        assignedEmployees: []
      };

      // Filter employees available for this shift
      const available = availabilities.filter(a =>
        !a.daysOff.includes(day) &&
        a.preferredShifts.includes(shiftType)
      );

      // Sort by seniority (senior > mid > junior)
      available.sort((a, b) => {
        const levels = { junior: 1, mid: 2, senior: 3 };
        return levels[b.user.seniority] - levels[a.user.seniority];
      });

      const assigned = [];

      for (const a of available) {
        const userId = a.user._id.toString();

        // Already assigned shifts
        const alreadyScheduledShifts = weeklyShifts.filter(s =>
          s.assignedEmployees.includes(userId)
        );

        // Constraint: max 5 shifts per week
        if (alreadyScheduledShifts.length >= 5) {
          console.log(`[SKIPPED] ${a.user.name}: max 5 shifts`);
          continue;
        }

        // Constraint: max hours per week
        const totalHours = alreadyScheduledShifts.length * 8;
        if (totalHours >= a.maxHoursPerWeek) {
          console.log(`[SKIPPED] ${a.user.name}: max hours reached`);
          continue;
        }

        // Constraint: night-to-morning shift
        const dayIndex = DAYS.indexOf(day);
        const prevDay = DAYS[(dayIndex + 6) % 7];
        const conflict = alreadyScheduledShifts.find(s =>
          s.day === prevDay && s.shiftType === 'night' && shiftType === 'morning'
        );
        if (conflict) {
          console.log(`[SKIPPED] ${a.user.name}: night-to-morning conflict`);
          continue;
        }

        // ✅ Assign employee
        assigned.push(userId);

        if (assigned.length >= maxEmployeesPerShift) break;
      }

      // ✅ Constraint: At least 1 senior
      const hasSenior = assigned.some(id => {
        const user = users.find(u => u._id.toString() === id);
        return user?.seniority === 'senior';
      });

      if (!hasSenior) {
        console.log(`[SKIPPED] ${day} ${shiftType}: no senior assigned`);
        continue;
      }

      // ✅ Constraint: Minimum employees per shift
      if (assigned.length < minEmployeesPerShift) {
        console.log(`[SKIPPED] ${day} ${shiftType}: not enough employees (need at least ${minEmployeesPerShift})`);
        continue;
      }

      shift.assignedEmployees = assigned;
      weeklyShifts.push(shift);

      console.log(`[SHIFT CREATED] ${day} ${shiftType}: ${assigned.length} assigned`);
    }
  }

  // ✅ Save new shifts to DB
  await Shift.deleteMany({});
  await Shift.insertMany(weeklyShifts);

  // 📌 Compare with previous shifts
const previousShifts = await Shift.find();
const newAssignments = new Map();

weeklyShifts.forEach(s => {
  s.assignedEmployees.forEach(id => {
    const key = id.toString();
    newAssignments.set(key, (newAssignments.get(key) || 0) + 1);
  });
});

const oldAssignments = new Map();
previousShifts.forEach(s => {
  s.assignedEmployees.forEach(id => {
    const key = id.toString();
    oldAssignments.set(key, (oldAssignments.get(key) || 0) + 1);
  });
});

// 📣 Notify if their shift count changed
for (const user of await User.find({ role: 'employee' })) {
  const oldCount = oldAssignments.get(user._id.toString()) || 0;
  const newCount = newAssignments.get(user._id.toString()) || 0;

  if (oldCount !== newCount) {
    await User.findByIdAndUpdate(user._id, {
      notification: `Heads up: Your assigned shifts changed (from ${oldCount} to ${newCount})`
    });
    console.log(`[NOTIFY] ${user.name} shift count changed: ${oldCount} → ${newCount}`);
  }
}


  // ✅ Add unmet preference notifications
  for (const a of availabilities) {
    const userId = a.user._id.toString();
    const assignedCount = weeklyShifts.filter(s =>
      s.assignedEmployees.includes(userId)
    ).length;

    const requestedShifts = a.preferredShifts.length * (7 - a.daysOff.length);
    const expected = Math.max(1, Math.min(Math.floor(requestedShifts / 2), 5));

    if (assignedCount < expected) {
      await User.findByIdAndUpdate(userId, {
        notification: `Note: We could only assign ${assignedCount} shift(s) this week.`
      });
      console.log(`[NOTIFIED] ${a.user.name}: only ${assignedCount} assigned (expected ${expected})`);
    }
  }

  return weeklyShifts;
}

module.exports = { generateWeeklySchedule };
