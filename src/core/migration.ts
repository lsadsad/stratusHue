/// <reference types="@figma/plugin-typings" />

// Migration utility to transfer plugin data between plugin IDs
// Since Figma sandboxes plugin data by ID, we use a temporary storage approach

/**
 * Exports all plugin data to a temporary shared namespace
 * Run this with the OLD plugin ID before switching
 */
export async function exportPluginDataToShared(): Promise<void> {
  try {
    console.log('📤 Exporting plugin data to shared namespace...');

    // Read current plugin data
    const bookmarks = figma.root.getPluginData('bookmarks');
    const anchorState = figma.root.getPluginData('anchorState');
    const recentHistory = figma.root.getPluginData('recentHistory');
    const uiSectionStates = figma.root.getPluginData('uiSectionStates');

    // Write to shared namespace (accessible across plugin IDs)
    if (bookmarks) {
      figma.root.setSharedPluginData('stratusHue', 'migration_bookmarks', bookmarks);
      console.log('✅ Exported bookmarks');
    }
    if (anchorState) {
      figma.root.setSharedPluginData('stratusHue', 'migration_anchorState', anchorState);
      console.log('✅ Exported anchor state');
    }
    if (recentHistory) {
      figma.root.setSharedPluginData('stratusHue', 'migration_recentHistory', recentHistory);
      console.log('✅ Exported recent history');
    }
    if (uiSectionStates) {
      figma.root.setSharedPluginData('stratusHue', 'migration_uiSectionStates', uiSectionStates);
      console.log('✅ Exported UI section states');
    }

    // Set export timestamp
    figma.root.setSharedPluginData('stratusHue', 'migration_timestamp', Date.now().toString());
    
    figma.notify('✅ Data exported successfully! You can now switch plugin IDs.');
    console.log('✅ Export completed successfully');

  } catch (error) {
    console.error('❌ Export failed:', error);
    figma.notify('❌ Export failed: ' + error);
  }
}

/**
 * Imports plugin data from the temporary shared namespace
 * Run this with the NEW plugin ID after switching
 */
export async function importPluginDataFromShared(): Promise<void> {
  try {
    console.log('📥 Importing plugin data from shared namespace...');

    // Check if there's data to import
    const timestamp = figma.root.getSharedPluginData('stratusHue', 'migration_timestamp');
    if (!timestamp) {
      console.log('ℹ️ No migration data found');
      figma.notify('ℹ️ No migration data found. Run export first with old plugin ID.');
      return;
    }

    // Read from shared namespace
    const bookmarks = figma.root.getSharedPluginData('stratusHue', 'migration_bookmarks');
    const anchorState = figma.root.getSharedPluginData('stratusHue', 'migration_anchorState');
    const recentHistory = figma.root.getSharedPluginData('stratusHue', 'migration_recentHistory');
    const uiSectionStates = figma.root.getSharedPluginData('stratusHue', 'migration_uiSectionStates');

    // Write to new plugin's storage
    let importedCount = 0;
    if (bookmarks) {
      figma.root.setPluginData('bookmarks', bookmarks);
      console.log('✅ Imported bookmarks');
      importedCount++;
    }
    if (anchorState) {
      figma.root.setPluginData('anchorState', anchorState);
      console.log('✅ Imported anchor state');
      importedCount++;
    }
    if (recentHistory) {
      figma.root.setPluginData('recentHistory', recentHistory);
      console.log('✅ Imported recent history');
      importedCount++;
    }
    if (uiSectionStates) {
      figma.root.setPluginData('uiSectionStates', uiSectionStates);
      console.log('✅ Imported UI section states');
      importedCount++;
    }

    if (importedCount > 0) {
      figma.notify(`✅ Successfully imported ${importedCount} data items!`);
      console.log('✅ Import completed successfully');
      
      // Clean up migration data
      figma.root.setSharedPluginData('stratusHue', 'migration_bookmarks', '');
      figma.root.setSharedPluginData('stratusHue', 'migration_anchorState', '');
      figma.root.setSharedPluginData('stratusHue', 'migration_recentHistory', '');
      figma.root.setSharedPluginData('stratusHue', 'migration_uiSectionStates', '');
      figma.root.setSharedPluginData('stratusHue', 'migration_timestamp', '');
      console.log('🧹 Cleaned up migration data');
    } else {
      figma.notify('⚠️ No data to import');
    }

  } catch (error) {
    console.error('❌ Import failed:', error);
    figma.notify('❌ Import failed: ' + error);
  }
}

