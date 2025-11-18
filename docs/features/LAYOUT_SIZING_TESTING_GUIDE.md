# Layout Sizing Feature - Quick Testing Guide

## 🚀 Quick Start

The 2-button layout sizing feature has been successfully implemented and built. Follow these steps to test it:

## 📋 Testing Steps

### Step 1: Load the Plugin
1. Open Figma
2. Go to **Plugins** → **Development** → **Import plugin from manifest**
3. Navigate to: `/Users/levinsadsad/Documents/Github/Stratus_Hue`
4. Select the `manifest.json` file
5. Run the plugin: **Plugins** → **stratusHue**

### Step 2: Prepare Test Layers

Create a simple test setup:

```
1. Create a Frame (press F)
2. Add Auto Layout to it (Shift + A)
3. Add some child elements inside (rectangles, text, etc.)
4. These child elements will have layout sizing properties
```

### Step 3: Test Basic Functionality

#### Test 1: No Selection
- [ ] Deselect all layers
- [ ] Open the "LAYOUT SIZING" section in plugin
- [ ] Verify buttons show "↔ —" and "↕ —"
- [ ] Verify buttons are disabled (grayed out)

#### Test 2: Single Layer in Auto Layout
- [ ] Select ONE child element inside your auto-layout frame
- [ ] Verify buttons become enabled
- [ ] Verify current modes are displayed (e.g., "↔ HUG", "↕ HUG")
- [ ] Click the **Width button** (↔)
- [ ] Should cycle: HUG → FILL → FIXED → HUG
- [ ] Each click shows a notification: "✓ Set width to [mode]"
- [ ] Verify the layer in Figma actually changes size behavior
- [ ] Click the **Height button** (↕)
- [ ] Should cycle independently
- [ ] Notification: "✓ Set height to [mode]"

#### Test 3: Multiple Selection
- [ ] Select MULTIPLE child elements in auto-layout
- [ ] If all have same sizing, buttons should show that mode
- [ ] Click width button
- [ ] All selected layers should update together
- [ ] Notification: "✓ Set width to [mode]"

#### Test 4: Invalid Selection (Not in Auto Layout)
- [ ] Select a regular frame (NOT child of auto-layout)
- [ ] Buttons should show "—" and be disabled
- [ ] Click either button
- [ ] Notification: "⚠️ Selected layers must be inside an auto-layout frame"

### Step 4: Visual Verification

After clicking the buttons, verify in Figma's right panel:
- [ ] The "Resizing" section matches the button labels
- [ ] Width setting: Hug/Fill/Fixed
- [ ] Height setting: Hug/Fill/Fixed

### Step 5: Test Edge Cases

#### Empty to Selection
- [ ] Start with nothing selected
- [ ] Select a layer in auto-layout
- [ ] Buttons should immediately update and enable

#### Selection to Empty
- [ ] Start with a layer selected
- [ ] Deselect all (Escape or click canvas)
- [ ] Buttons should immediately show "—" and disable

#### Mixed Auto Layout
- [ ] Create multiple auto-layout frames
- [ ] Set one child to HUG, another to FILL
- [ ] Select both
- [ ] Buttons should show "—" (mixed state)

## ✅ Expected Results

### Visual Appearance
```
┌─────────────────────────────────────┐
│ 📐 LAYOUT SIZING                    │
├─────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐    │
│  │  ↔  HUG    │  │  ↕  FILL   │    │
│  └────────────┘  └────────────┘    │
└─────────────────────────────────────┘
```
Clean, minimal labels - arrow icons make the purpose clear

### Cycling Order
```
Click 1: HUG  →  FILL
Click 2: FILL →  FIXED
Click 3: FIXED → HUG
Click 4: HUG  →  FILL
... (repeats)
```

### Notifications
```
✓ Set width to HUG
✓ Set height to FILL
✓ Set width to FIXED
⚠️ Please select at least one layer
⚠️ Selected layers must be inside an auto-layout frame
```

## 🐛 Troubleshooting

### Buttons Don't Appear
- Verify the plugin was rebuilt: `npm run build`
- Reload the plugin in Figma
- Check the dist/ folder contains updated files

### Buttons Show "—" When They Shouldn't
- Ensure the selected layer is a CHILD of an auto-layout frame
- Not the auto-layout frame itself
- Auto-layout frame children have layout sizing properties

### Buttons Don't Update on Selection Change
- This is unlikely but if it occurs:
- Check browser console for errors (Plugins → Development → Open Console)
- Verify no JavaScript errors

### Modes Don't Match Figma UI
- Verify you're looking at the correct layer
- The plugin shows the selected layer's properties
- Not the parent frame's properties

## 📸 Screenshots Checklist

When testing, you may want to capture:
- [ ] Layout Sizing section collapsed
- [ ] Layout Sizing section expanded with no selection
- [ ] Buttons enabled showing current modes
- [ ] Notification when cycling modes
- [ ] Figma right panel showing matching properties

## 🎯 Success Criteria

The feature is working correctly if:

1. ✅ Buttons appear in a collapsible "LAYOUT SIZING" section
2. ✅ Buttons show current mode for single selections
3. ✅ Buttons show "—" when nothing selected
4. ✅ Clicking cycles through: HUG → FILL → FIXED
5. ✅ Both width and height work independently
6. ✅ Works on multiple selections
7. ✅ Shows warning for invalid selections
8. ✅ Updates immediately on selection change
9. ✅ Notifications appear for each action
10. ✅ Layer properties in Figma match button labels

## 📝 Notes

- The feature follows Figma's Auto Layout behavior exactly
- Only works on layers that support layout sizing (children of auto-layout frames)
- The cycle order matches Figma's typical workflow: Hug → Fill → Fixed
- Keyboard shortcuts are not implemented yet (future enhancement)
- The feature is fully accessible with screen reader support

## 🔄 Next Actions

After successful testing:
1. Consider adding keyboard shortcuts (e.g., Cmd+Alt+W for width, Cmd+Alt+H for height)
2. Optional: Add visual color coding for different modes
3. Optional: Support for showing mixed states more explicitly
4. Optional: Add tooltip hints for new users

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify the build completed successfully
3. Ensure you're testing with the correct layer types
4. Refer to the implementation summary: `LAYOUT_SIZING_FEATURE.md`

