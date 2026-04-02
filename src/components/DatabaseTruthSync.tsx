import React, { useEffect, useRef } from 'react';
import { useProject } from '../context/ProjectContext';
import { SyncService } from '../services/SyncService';
import { useAuth } from '../context/AuthContext';

/**
 * DatabaseTruthSync
 * 
 * This component handles the automatic synchronization of the "FlowForge AI" 
 * project data with the actual codebase state. It runs once per session 
 * when the project is selected.
 */
export default function DatabaseTruthSync() {
  const { 
    projects,
    selectedProject, 
    pages, 
    components, 
    features,
    functions,
    updateProject,
    updateProjectById,
    updatePage, 
    updateComponent, 
    updateFeature,
    updateLLMFunction,
    addPage,
    addComponent,
    addFeature,
    addLLMFunction
  } = useProject();
  const { profile } = useAuth();
  const syncPerformed = useRef(false);

  useEffect(() => {
    const performSync = async () => {
      if (!selectedProject || selectedProject.name !== 'FlowForge AI' || syncPerformed.current) return;
      
      const isAdmin = profile?.role === 'Admin' || profile?.email === 'lacometta33@gmail.com';
      if (!isAdmin) return;

      console.log('Starting Database Truth Sync for FlowForge AI...');
      syncPerformed.current = true;

      try {
        // 0. Consolidate duplicates if any
        const duplicates = projects.filter(p => p.name === 'FlowForge AI' && p.id !== selectedProject.id);
        if (duplicates.length > 0) {
          console.log(`Sync: Consolidating ${duplicates.length} duplicates...`);
          for (const duplicate of duplicates) {
            await updateProjectById(duplicate.id, { 
              name: `FlowForge AI (Duplicate - ${duplicate.id.substring(0, 4)})`, 
              status: 'Archived' 
            } as any);
          }
        }

        // 1. Analyze current state
        const { 
          updatedPages, 
          updatedComponents, 
          updatedFeatures, 
          updatedFunctions 
        } = await SyncService.analyzeSyncState(
          selectedProject,
          features,
          pages,
          components,
          [], // layouts
          functions
        );

        // 2. Update existing entities with new integrity status
        for (const page of updatedPages) {
          await updatePage(page.id, { integrityStatus: page.integrityStatus });
        }
        for (const component of updatedComponents) {
          await updateComponent(component.id, { integrityStatus: component.integrityStatus });
        }
        for (const feature of updatedFeatures) {
          await updateFeature(feature.id, { integrityStatus: feature.integrityStatus });
        }
        for (const fn of updatedFunctions) {
          await updateLLMFunction(fn.id, { integrityStatus: fn.integrityStatus });
        }

        // 3. Check for missing entities from codebase
        const codebaseData = SyncService.generateProjectFromCodebase(selectedProject.id);
        
        // Add missing pages
        for (const codebasePage of codebaseData.pages) {
          const exists = pages.some(p => p.name === codebasePage.name);
          if (!exists) {
            console.log(`Sync: Adding missing page ${codebasePage.name}`);
            await addPage(codebasePage as any);
          }
        }

        // Add missing components
        for (const codebaseComp of codebaseData.components) {
          const exists = components.some(c => c.name === codebaseComp.name);
          if (!exists) {
            console.log(`Sync: Adding missing component ${codebaseComp.name}`);
            await addComponent(codebaseComp as any);
          }
        }

        console.log('Database Truth Sync completed successfully.');
      } catch (error) {
        console.error('Database Truth Sync failed:', error);
      }
    };

    performSync();
  }, [selectedProject, pages, components, features, functions, profile]);

  return null;
}
