import { MonitorContext } from '@/context/MonitorContext';
import {
  IMonitorDocument,
  IMonitorState,
  IUseHome,
} from '@/interfaces/monitor.interface';
import {
  ENABLE_AUTO_REFRESH,
  GET_USER_MONITORS,
  MONITORS_UPDATED,
} from '@/queries/status';
import { usePagination } from '@/utils/usePagination';
import {
  getLocalStorageItem,
  setLocalStorageItem,
  showErrorToast,
} from '@/utils/utils';
import { useLazyQuery, useQuery, useSubscription } from '@apollo/client';
import { some } from 'lodash';
import { useRouter, useSearchParams } from 'next/navigation';
import { useContext, useEffect, useRef, useState } from 'react';

export const useHome = (): IUseHome => {
  const {
    state: { user },
  } = useContext(MonitorContext);
  const router = useRouter();
  const [monitors, setMonitors] = useState<IMonitorDocument[]>([]);
  const [monitorState, setMonitorState] = useState<IMonitorState>({
    showModal: false,
    enableRefresh: false,
    autoRefreshLoading: false,
  });
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const [view, setView] = useState<string>('');
  const monitorsRef = useRef<IMonitorDocument[]>([]);
  const autoMonitorsRef = useRef<IMonitorDocument[]>([]);
  const [limit, updateLimit] = usePagination(0, 10);
  const { data, loading } = useQuery(GET_USER_MONITORS, {
    fetchPolicy: 'network-only',
    variables: { userId: `${user?.id}` },
  });

  useSubscription(MONITORS_UPDATED, {
    onData: ({ client, data }) => {
      const { userId, monitors } = data.data.monitorsUpdated;
      if (userId === user?.id) {
        setMonitorState((prevState: IMonitorState) => ({
          ...prevState,
          autoRefreshLoading: true,
        }));
        autoMonitorsRef.current = monitors;
        client.cache.updateQuery({ query: GET_USER_MONITORS }, () => {
          return {
            getUserMonitors: {
              __typename: 'MonitorResponse',
              monitors,
            },
          };
        });
      } else {
        setMonitorState((prevState: IMonitorState) => ({
          ...prevState,
          autoRefreshLoading: false,
        }));
      }
    },
  });
  const [getUserMonitors] = useLazyQuery(GET_USER_MONITORS, {
    fetchPolicy: 'network-only',
    variables: { userId: `${user?.id}` },
  });
  const [autoRefresh, { data: refreshData }] = useLazyQuery(
    ENABLE_AUTO_REFRESH,
    {
      fetchPolicy: 'network-only',
    }
  );
  const storageViewItem: string = getLocalStorageItem('view');
  const isRefreshed = JSON.parse(getLocalStorageItem('refresh'));
  const openModal = JSON.parse(`${params.get('open')}`);
  const hasActiveMonitors: boolean = some(
    monitors,
    (monitor: IMonitorDocument) => monitor.active
  );
  const refreshMonitors = async (): Promise<void> => {
    if (hasActiveMonitors) {
      setMonitorState((previousState: IMonitorState) => ({
        ...previousState,
        autoRefreshLoading: true,
      }));
      const result = await getUserMonitors();
      if (result) {
        monitorsRef.current = result.data.getUserMonitors.monitors;
        setMonitors(result.data.getUserMonitors.monitors);
        setMonitorState((previousState: IMonitorState) => ({
          ...previousState,
          autoRefreshLoading: false,
        }));
      }
    } else {
      showErrorToast('There are no active monitor to refresh');
    }
  };
  const enableAutoRefresh = async (): Promise<void> => {
    try {
      if (hasActiveMonitors) {
        await autoRefresh({
          variables: { userId: `${user?.id}`, refresh: !isRefreshed },
        });
        setMonitorState((previousState: IMonitorState) => ({
          ...previousState,
          enableRefresh: !isRefreshed,
        }));
        setLocalStorageItem('refresh', JSON.stringify(!isRefreshed));
      } else {
        showErrorToast('There are no active monitor to refresh');
      }
    } catch (error) {
      console.log(error);
      showErrorToast('Error enabling auto refresh');
    }
  };
  const closeUptimeModal = (): void => {
    params.delete('open');
    router.push(`/status?${params}`);
  };

  useEffect(() => {
    if (!storageViewItem) {
      setLocalStorageItem('view', JSON.stringify('box'));
    }
    if (isRefreshed === null) {
      setLocalStorageItem('refresh', JSON.stringify('false'));
      setMonitorState((previousState: IMonitorState) => ({
        ...previousState,
        enableRefresh: false,
      }));
    } else {
      setMonitorState((previousState: IMonitorState) => ({
        ...previousState,
        enableRefresh: isRefreshed,
      }));
    }
    setView(storageViewItem || 'box');
  }, [storageViewItem, isRefreshed]);

  useEffect(() => {
    if (data && data.getUserMonitors) {
      monitorsRef.current = data.getUserMonitors.monitors;
      setMonitors(data.getUserMonitors.monitors);
    }
    if (refreshData && refreshData.autoRefresh) {
      setLocalStorageItem(
        'refresh',
        JSON.stringify(refreshData.autoRefresh.refresh)
      );
      setMonitorState((previousState: IMonitorState) => ({
        ...previousState,
        enableRefresh: refreshData.autoRefresh.refresh,
      }));
    }
    if (autoMonitorsRef.current.length) {
      autoMonitorsRef.current = [];
      setMonitorState((previousState: IMonitorState) => ({
        ...previousState,
        autoRefreshLoading: true,
      }));
    } else {
      setTimeout(() => {
        setMonitorState((previousState: IMonitorState) => ({
          ...previousState,
          autoRefreshLoading: false,
        }));
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, refreshData, autoMonitorsRef.current]);

  return {
    monitorState,
    monitors,
    limit,
    isRefreshed,
    autoMonitorsRef,
    monitorsRef,
    view,
    loading,
    openModal,
    updateLimit,
    setView,
    setMonitors,
    setMonitorState,
    refreshMonitors,
    enableAutoRefresh,
    closeUptimeModal,
  };
};
