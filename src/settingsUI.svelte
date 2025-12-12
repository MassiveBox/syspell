<script lang="ts">
    import SettingPanel from "./libs/components/setting-panel.svelte";
    import type {Settings, SettingsUIGroup} from "./settings";

    export let settings: Settings
    export let groups: SettingsUIGroup[];
    export let i18n: Record<string, any>;

    let focusGroupID = groups[0].id;

    /********** Events **********/
    interface ChangeEvent {
        group: string;
        key: string;
        value: any;
    }

    const onChanged = ({ detail }: CustomEvent<ChangeEvent>) => {
        settings.set(detail.key, detail.value)
        settings.changedDialog = true
    };

    const save = () => {
        settings.save()
        window.location.reload()
    }
</script>

<div class="fn__flex-1 fn__flex config__panel">
    <ul class="b3-tab-bar b3-list b3-list--background">
        {#each groups as group}
            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <li
                    data-name="editor"
                    class:b3-list-item--focus={group.id === focusGroupID}
                    class="b3-list-item"
                    on:click={() => {
                    focusGroupID = group.id;
                }}
                    on:keydown={() => {}}
            >
                <span class="b3-list-item__text">{group.name}</span>
            </li>
        {/each}
        <li>
            <button on:click={ save } class="b3-button" style="width: 100%; translate: -0.5rem">
                <span>{ i18n.settings.save }</span>
            </button>
        </li>
    </ul>
    <div class="config__tab-wrap">
        {#each groups as group}
            <SettingPanel
                    group={group.name}
                    settingItems={group.items}
                    display={focusGroupID === group.id}
                    on:changed={onChanged}
                    on:click={({ detail }) => { console.debug("Click:", detail.key); }}
            >
                <div class="fn__flex b3-label">
                    {group.tip}
                </div>
            </SettingPanel>
        {/each}
    </div>
</div>

<style lang="scss">
  .config__panel {
    height: 100%;
  }
  .config__panel > ul > li {
    padding-left: 1rem;
  }
</style>
