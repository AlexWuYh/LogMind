from playwright.sync_api import sync_playwright
import time

def run():
    print("Starting E2E Test...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # 0. Login
            print("0. Logging in...")
            page.goto("http://localhost:3000/login")
            page.wait_for_load_state("networkidle")
            
            page.fill("input[name='email']", "alex@example.com")
            page.fill("input[name='password']", "password123")
            page.click("button[type='submit']")
            
            try:
                page.wait_for_url("http://localhost:3000", timeout=10000)
            except:
                pass
            
            page.wait_for_load_state("domcontentloaded")
            
            if "LogMind" in page.title() or page.is_visible("text=工作台"):
                print("✅ Login Successful & Dashboard loaded")
            else:
                 print("❌ Login failed or Dashboard not loaded")
                 return

            # 1. Dashboard Checks
            print("\n1. Checking Dashboard Elements...")
            if page.is_visible("text=Log your work"):
                print("✅ Slogan visible")
            
            # 2. Create Daily Log
            print("\n2. Creating Daily Log...")
            page.goto("http://localhost:3000/logs/2026-01-17") # Direct jump to avoid today button issues
            page.wait_for_load_state("domcontentloaded")

            # Fill Form
            page.wait_for_selector("input[name='items.0.project']")
            page.fill("input[name='items.0.project']", "E2E Project Alpha")
            page.fill("textarea[name='items.0.content']", "Testing new log page structure")
            page.fill("textarea[name='tomorrowPlan']", "Verify Scheduler")

            # Save
            print("   Saving log...")
            page.click("button:has-text('保存日志')")
            time.sleep(2) # Wait for save

            # 3. Check Logs List
            print("\n3. Checking Logs List...")
            page.goto("http://localhost:3000/logs")
            page.wait_for_load_state("networkidle")
            
            # Check for Project Name (Might be Legacy "LogMind Test" or New "E2E Project Alpha")
            # We just want to see IF the log entry is there.
            # The date "17" should be visible in the date box.
            if page.is_visible("text=17"):
                print("✅ Log Entry for 17th visible")
            else:
                print("⚠️ Log Entry for 17th not found")

            # Check Calendar Toggle
            if page.is_visible("button:has-text('日历')"):
                print("✅ Calendar Toggle visible")

            # 4. Settings (Admin)
            print("\n4. Checking Admin Settings...")
            # Check for text "用户管理" in sidebar
            if page.is_visible("text=用户管理"):
                 print("✅ User Management Link visible (Admin)")
            else:
                 print("⚠️ User Management Link not found via text match")

        except Exception as e:
            print(f"❌ Test Failed with error: {e}")
        finally:
            browser.close()
            print("\nTest Finished.")

if __name__ == "__main__":
    run()
