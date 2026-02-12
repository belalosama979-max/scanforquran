# Create directories
New-Item -ItemType Directory -Force -Path "client/components/ui"
New-Item -ItemType Directory -Force -Path "client/hooks"
New-Item -ItemType Directory -Force -Path "client/lib"
New-Item -ItemType Directory -Force -Path "client/pages"
New-Item -ItemType Directory -Force -Path "client/integrations/supabase"

# Move Hooks
Move-Item "client/use-mobile.tsx" "client/hooks/"
Move-Item "client/use-toast.ts" "client/hooks/"
Move-Item "client/useAuth.ts" "client/hooks/"
Move-Item "client/useNotebookProcessor.ts" "client/hooks/"
Move-Item "client/use-toast (1).ts" "client/hooks/" # Duplicate?

# Move Lib
Move-Item "client/utils.ts" "client/lib/"
Move-Item "client/voiceUtils.ts" "client/lib/"

# Move Integrations
Move-Item "client/client.ts" "client/integrations/supabase/"
Move-Item "client/types.ts" "client/integrations/supabase/"

# Move UI Components
$ui = @("accordion.tsx", "alert-dialog.tsx", "alert.tsx", "aspect-ratio.tsx", "avatar.tsx", "badge.tsx", 
"breadcrumb.tsx", "button.tsx", "calendar.tsx", "card.tsx", "carousel.tsx", "chart.tsx", "checkbox.tsx", 
"collapsible.tsx", "command.tsx", "context-menu.tsx", "dialog.tsx", "drawer.tsx", "dropdown-menu.tsx", 
"form.tsx", "hover-card.tsx", "input-otp.tsx", "input.tsx", "label.tsx", "menubar.tsx", "navigation-menu.tsx", 
"pagination.tsx", "popover.tsx", "progress.tsx", "radio-group.tsx", "resizable.tsx", "scroll-area.tsx", 
"select.tsx", "separator.tsx", "sheet.tsx", "skeleton.tsx", "slider.tsx", "sonner.tsx", "switch.tsx", 
"table.tsx", "tabs.tsx", "textarea.tsx", "toast.tsx", "toaster.tsx", "toggle-group.tsx", "toggle.tsx", 
"tooltip.tsx")

foreach ($file in $ui) {
    if (Test-Path "client/$file") {
        Move-Item "client/$file" "client/components/ui/"
    }
}

# Move Main Components
$comps = @("Header.tsx", "ImageUploader.tsx", "ProcessingState.tsx", "ReviewState.tsx", 
"StudentRecordsPreview.tsx", "StudentSelector.tsx", "SuccessState.tsx", "VoiceInput.tsx", 
"SplashScreen.tsx", "InstallPrompt.tsx", "NavLink.tsx")

foreach ($file in $comps) {
    if (Test-Path "client/$file") {
        Move-Item "client/$file" "client/components/"
    }
}

# Move Pages
$pages = @("Index.tsx", "Index (1).tsx", "NotFound.tsx", "Auth.tsx")
foreach ($file in $pages) {
    if (Test-Path "client/$file") {
        Move-Item "client/$file" "client/pages/"
    }
}
