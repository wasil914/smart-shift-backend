const User = require('../models/User');
const Availability = require('../models/Availability');
const Shift = require('../models/Shift');

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const SHIFT_TYPES = ['morning', 'afternoon', 'night'];

const MAX_EMPLOYEES_PER_SHIFT = 3;

async function generateWeeklySchedule() {
  const users = await User.find();
  const availabilities = await Availability.find().populate('user');

  const weeklyShifts = [];

  for (const day of DAYS) {
    for (const shiftType of SHIFT_TYPES) {
      const shift = {
        day,
        shiftType,
        assignedEmployees: []
      };

      // Filter employees available for this day and shift
      const available = availabilities.filter(a =>
        !a.daysOff.includes(day) &&
        a.preferredShifts.includes(shiftType)
      );

      // Sort by seniority, then randomize for fairness
      available.sort((a, b) => {
        const levels = { junior: 1, mid: 2, senior: 3 };
        return levels[b.user.seniority] - levels[a.user.seniority];
      });

      const assigned = [];

      for (const a of available) {
        const userId = a.user._id.toString();

        const alreadyScheduledShifts = weeklyShifts.filter(s =>
          s.assignedEmployees.includes(userId)
        );

        if (alreadyScheduledShifts.length >= 5) continue;

        const totalHours = alreadyScheduledShifts.length * 8;
        if (totalHours >= a.maxHoursPerWeek) continue;

        // Basic check: skip if assigned to previous day's night + today morning
        const conflict = alreadyScheduledShifts.find(s => {
          const dayIndex = DAYS.indexOf(day);
          const prevDay = DAYS[(dayIndex + 6) % 7];
          return (
            (s.day === prevDay && s.shiftType === 'night') &&
            (shiftType === 'morning')
          );
        });

        if (conflict) continue;

        assigned.push(userId);

        if (assigned.length >= MAX_EMPLOYEES_PER_SHIFT) break;
      }

      // At least 1 senior?
      const hasSenior = assigned.some(id => {
        const user = users.find(u => u._id.toString() === id);
        return user?.seniority === 'senior';
      });

      if (!hasSenior) continue;

      shift.assignedEmployees = assigned;
      weeklyShifts.push(shift);
    }
  }

  // Save to DB
  await Shift.deleteMany({});
  await Shift.insertMany(weeklyShifts);

  return weeklyShifts;
}

module.exports = { generateWeeklySchedule };
